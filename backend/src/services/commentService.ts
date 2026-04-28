import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { HttpError } from '../utils/httpError';

const createCommentSchema = z.object({
  content: z.string().trim().min(1, 'Comment cannot be empty').max(2000),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;

export const validateCreateCommentInput = (input: unknown) => createCommentSchema.parse(input);

const COMMENT_SELECT = {
  id: true,
  content: true,
  isDeleted: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: { id: true, fullName: true, role: true },
  },
} as const;

export const listArticleComments = async (articleId: string) => {
  return prisma.articleComment.findMany({
    where: { articleId },
    select: COMMENT_SELECT,
    orderBy: { createdAt: 'asc' },
  });
};

export const createComment = async (
  articleId: string,
  userId: string,
  input: CreateCommentInput
) => {
  const article = await prisma.article.findFirst({
    where: { id: articleId, status: 'PUBLISHED', isPublic: true, commentsEnabled: true },
  });

  if (!article) {
    throw new HttpError(
      404,
      'Not Found',
      'Article not found, not published, or comments are disabled'
    );
  }

  return prisma.articleComment.create({
    data: { articleId, userId, content: input.content },
    select: COMMENT_SELECT,
  });
};

export const deleteComment = async (
  commentId: string,
  userId: string,
  isAdmin: boolean
) => {
  const comment = await prisma.articleComment.findUnique({ where: { id: commentId } });

  if (!comment) {
    throw new HttpError(404, 'Not Found', `Comment '${commentId}' not found`);
  }

  if (!isAdmin && comment.userId !== userId) {
    throw new HttpError(403, 'Forbidden', 'You can only delete your own comments');
  }

  // Soft delete
  return prisma.articleComment.update({
    where: { id: commentId },
    data: { isDeleted: true },
    select: COMMENT_SELECT,
  });
};
