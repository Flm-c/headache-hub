import slugify from 'slugify';
import { ArticleStatus } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { HttpError } from '../utils/httpError';
import { logAudit } from '../utils/auditLog';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const createArticleSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(240),
  content: z.string().trim().min(1, 'Content is required'),
  excerpt: z.string().trim().max(500).nullable().optional(),
  commentsEnabled: z.boolean().optional().default(false),
});

const updateArticleSchema = z.object({
  title: z.string().trim().min(3).max(240).optional(),
  content: z.string().trim().min(1).optional(),
  excerpt: z.string().trim().max(500).nullable().optional(),
  commentsEnabled: z.boolean().optional(),
});

const listPublicQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
  search: z.string().trim().max(120).optional(),
});

export type CreateArticleInput = z.infer<typeof createArticleSchema>;
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>;
export type ListPublicQuery = z.infer<typeof listPublicQuerySchema>;

export const validateCreateArticleInput = (input: unknown) => createArticleSchema.parse(input);
export const validateUpdateArticleInput = (input: unknown) => updateArticleSchema.parse(input);
export const validateListPublicQuery = (input: unknown) => listPublicQuerySchema.parse(input);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const AUTHOR_SELECT = {
  id: true,
  fullName: true,
  role: true,
};

const articleSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  status: true,
  commentsEnabled: true,
  isPublic: true,
  createdAt: true,
  publishedAt: true,
  updatedAt: true,
  author: { select: AUTHOR_SELECT },
} as const;

const articleWithContentSelect = {
  ...articleSelect,
  content: true,
} as const;

const generateUniqueSlug = async (title: string, excludeId?: string): Promise<string> => {
  const base = slugify(title, { lower: true, strict: true, trim: true });
  let slug = base;
  let attempt = 0;

  while (true) {
    const existing = await prisma.article.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) {
      return slug;
    }
    attempt += 1;
    slug = `${base}-${attempt}`;
  }
};

// ─── Public API ───────────────────────────────────────────────────────────────

export const listPublishedArticles = async (query: ListPublicQuery) => {
  const where = {
    status: ArticleStatus.PUBLISHED,
    isPublic: true,
    ...(query.search
      ? {
          OR: [
            { title: { contains: query.search, mode: 'insensitive' as const } },
            { excerpt: { contains: query.search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const [total, items] = await prisma.$transaction([
    prisma.article.count({ where }),
    prisma.article.findMany({
      where,
      select: articleSelect,
      orderBy: { publishedAt: 'desc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);

  return {
    items,
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    },
  };
};

export const getPublishedArticleBySlug = async (slug: string) => {
  const article = await prisma.article.findFirst({
    where: { slug, status: ArticleStatus.PUBLISHED, isPublic: true },
    select: articleWithContentSelect,
  });

  if (!article) {
    throw new HttpError(404, 'Not Found', `Article '${slug}' not found`);
  }

  return article;
};

// ─── Editor / Author API ──────────────────────────────────────────────────────

export const listMyArticles = async (authorId: string) => {
  return prisma.article.findMany({
    where: { authorId },
    select: articleSelect,
    orderBy: { updatedAt: 'desc' },
  });
};

export const getMyArticleById = async (articleId: string, authorId: string) => {
  const article = await prisma.article.findFirst({
    where: { id: articleId, authorId },
    select: articleWithContentSelect,
  });

  if (!article) {
    throw new HttpError(404, 'Not Found', `Article '${articleId}' not found`);
  }

  return article;
};

export const createArticle = async (authorId: string, input: CreateArticleInput) => {
  const slug = await generateUniqueSlug(input.title);

  return prisma.article.create({
    data: {
      title: input.title,
      slug,
      content: input.content,
      excerpt: input.excerpt ?? null,
      commentsEnabled: input.commentsEnabled ?? false,
      authorId,
    },
    select: articleWithContentSelect,
  });
};

export const updateArticle = async (
  articleId: string,
  authorId: string,
  input: UpdateArticleInput,
  isAdmin: boolean
) => {
  const existing = await prisma.article.findFirst({
    where: { id: articleId, ...(isAdmin ? {} : { authorId }) },
  });

  if (!existing) {
    throw new HttpError(404, 'Not Found', `Article '${articleId}' not found`);
  }

  const slug =
    input.title && input.title !== existing.title
      ? await generateUniqueSlug(input.title, articleId)
      : undefined;

  return prisma.article.update({
    where: { id: articleId },
    data: {
      title: input.title,
      slug,
      content: input.content,
      excerpt: input.excerpt,
      commentsEnabled: input.commentsEnabled,
      // If content or title changes, reset to DRAFT (author must re-publish)
      ...(input.title || input.content ? { status: ArticleStatus.DRAFT, publishedAt: null } : {}),
    },
    select: articleWithContentSelect,
  });
};

export const publishArticle = async (articleId: string, authorId: string, isAdmin: boolean) => {
  const existing = await prisma.article.findFirst({
    where: { id: articleId, ...(isAdmin ? {} : { authorId }) },
  });

  if (!existing) {
    throw new HttpError(404, 'Not Found', `Article '${articleId}' not found`);
  }

  if (!existing.content.trim()) {
    throw new HttpError(400, 'Bad Request', 'Cannot publish an article with empty content');
  }

  const updated = await prisma.article.update({
    where: { id: articleId },
    data: { status: ArticleStatus.PUBLISHED, publishedAt: new Date() },
    select: articleWithContentSelect,
  });

  logAudit(authorId, 'ARTICLE_PUBLISHED', 'article', articleId);
  return updated;
};

export const unpublishArticle = async (articleId: string, authorId: string, isAdmin: boolean) => {
  const existing = await prisma.article.findFirst({
    where: { id: articleId, ...(isAdmin ? {} : { authorId }) },
  });

  if (!existing) {
    throw new HttpError(404, 'Not Found', `Article '${articleId}' not found`);
  }

  const updated = await prisma.article.update({
    where: { id: articleId },
    data: { status: ArticleStatus.DRAFT, publishedAt: null },
    select: articleWithContentSelect,
  });

  logAudit(authorId, 'ARTICLE_UNPUBLISHED', 'article', articleId);
  return updated;
};

export const deleteArticle = async (articleId: string, authorId: string, isAdmin: boolean) => {
  const existing = await prisma.article.findFirst({
    where: { id: articleId, ...(isAdmin ? {} : { authorId }) },
  });

  if (!existing) {
    throw new HttpError(404, 'Not Found', `Article '${articleId}' not found`);
  }

  await prisma.article.delete({ where: { id: articleId } });
};

// ─── Admin: all articles ──────────────────────────────────────────────────────

export const listAllArticles = async () => {
  return prisma.article.findMany({
    select: articleSelect,
    orderBy: { updatedAt: 'desc' },
  });
};
