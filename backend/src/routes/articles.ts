import { Router, Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import { AuthenticatedRequest } from '../types/auth';
import { sendSuccess } from '../utils/apiResponse';
import {
  createArticle,
  deleteArticle,
  getMyArticleById,
  getPublishedArticleBySlug,
  listAllArticles,
  listMyArticles,
  listPublishedArticles,
  publishArticle,
  unpublishArticle,
  updateArticle,
  validateCreateArticleInput,
  validateListPublicQuery,
  validateUpdateArticleInput,
} from '../services/articleService';
import {
  createComment,
  deleteComment,
  listArticleComments,
  validateCreateCommentInput,
} from '../services/commentService';

const articlesRouter = Router();

// ─── Public routes (no auth required) ────────────────────────────────────────

/**
 * @openapi
 * /api/articles:
 *   get:
 *     tags: [Articles]
 *     summary: Список опубликованных статей (публичный)
 *     security: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Поиск по заголовку
 *     responses:
 *       200:
 *         description: Список опубликованных статей
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         items:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Article'
 *                         total:
 *                           type: integer
 */
articlesRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = validateListPublicQuery(req.query);
    const result = await listPublishedArticles(query);
    sendSuccess(res, 200, 'Articles fetched successfully', result);
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/articles/slug/{slug}:
 *   get:
 *     tags: [Articles]
 *     summary: Получить опубликованную статью по slug (публичный)
 *     security: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Статья найдена
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Article'
 *       404:
 *         description: Статья не найдена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
articlesRouter.get(
  '/slug/:slug',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const article = await getPublishedArticleBySlug(req.params.slug);
      sendSuccess(res, 200, 'Article fetched successfully', article);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @openapi
 * /api/articles/{articleId}/comments:
 *   get:
 *     tags: [Articles]
 *     summary: Список комментариев к статье (публичный)
 *     security: []
 *     parameters:
 *       - in: path
 *         name: articleId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Список комментариев
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ArticleComment'
 *   post:
 *     tags: [Articles]
 *     summary: Добавить комментарий к статье
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: articleId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Комментарий создан
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ArticleComment'
 *       403:
 *         description: Аккаунт не одобрен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

// Public: list comments for a published article
articlesRouter.get(
  '/:articleId/comments',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const comments = await listArticleComments(req.params.articleId);
      sendSuccess(res, 200, 'Comments fetched successfully', comments);
    } catch (error) {
      next(error);
    }
  }
);

// ─── Author routes (EDITOR or ADMIN) ─────────────────────────────────────────

const authorMiddleware = [authenticate, requireRole(UserRole.EDITOR, UserRole.ADMIN)];

/**
 * @openapi
 * /api/articles/my:
 *   get:
 *     tags: [Articles]
 *     summary: Получить список своих статей (EDITOR/ADMIN)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список статей автора
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Article'
 *       403:
 *         description: Нет прав
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
articlesRouter.get(
  '/my',
  ...authorMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const articles = await listMyArticles(req.user!.id);
      sendSuccess(res, 200, 'My articles fetched successfully', articles);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @openapi
 * /api/articles/my/{articleId}:
 *   get:
 *     tags: [Articles]
 *     summary: Получить свою статью по ID (EDITOR/ADMIN)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: articleId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Статья найдена
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Article'
 *       404:
 *         description: Не найдена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
articlesRouter.get(
  '/my/:articleId',
  ...authorMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const article = await getMyArticleById(req.params.articleId, req.user!.id);
      sendSuccess(res, 200, 'Article fetched successfully', article);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @openapi
 * /api/articles/{articleId}:
 *   patch:
 *     tags: [Articles]
 *     summary: Обновить статью (EDITOR/ADMIN)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: articleId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Статья обновлена
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Article'
 *       403:
 *         description: Нет прав
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   delete:
 *     tags: [Articles]
 *     summary: Удалить статью (EDITOR/ADMIN)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: articleId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Статья удалена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       403:
 *         description: Нет прав
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @openapi
 * /api/articles:
 *   post:
 *     tags: [Articles]
 *     summary: Создать новую статью (EDITOR/ADMIN)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, content]
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *                 description: HTML-контент (Tiptap)
 *     responses:
 *       201:
 *         description: Статья создана (черновик)
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Article'
 *       403:
 *         description: Нет прав
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
articlesRouter.post(
  '/',
  ...authorMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const input = validateCreateArticleInput(req.body);
      const article = await createArticle(req.user!.id, input);
      sendSuccess(res, 201, 'Article created successfully', article);
    } catch (error) {
      next(error);
    }
  }
);

articlesRouter.patch(
  '/:articleId',
  ...authorMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const input = validateUpdateArticleInput(req.body);
      const isAdmin = req.user!.role === UserRole.ADMIN;
      const article = await updateArticle(req.params.articleId, req.user!.id, input, isAdmin);
      sendSuccess(res, 200, 'Article updated successfully', article);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @openapi
 * /api/articles/{articleId}/publish:
 *   patch:
 *     tags: [Articles]
 *     summary: Опубликовать статью (EDITOR/ADMIN)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: articleId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Статья опубликована
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Article'
 *       403:
 *         description: Нет прав
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
articlesRouter.patch(
  '/:articleId/publish',
  ...authorMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const isAdmin = req.user!.role === UserRole.ADMIN;
      const article = await publishArticle(req.params.articleId, req.user!.id, isAdmin);
      sendSuccess(res, 200, 'Article published successfully', article);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @openapi
 * /api/articles/{articleId}/unpublish:
 *   patch:
 *     tags: [Articles]
 *     summary: Снять статью с публикации (EDITOR/ADMIN)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: articleId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Статья снята с публикации
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Article'
 *       403:
 *         description: Нет прав
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
articlesRouter.patch(
  '/:articleId/unpublish',
  ...authorMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const isAdmin = req.user!.role === UserRole.ADMIN;
      const article = await unpublishArticle(req.params.articleId, req.user!.id, isAdmin);
      sendSuccess(res, 200, 'Article unpublished successfully', article);
    } catch (error) {
      next(error);
    }
  }
);

articlesRouter.delete(
  '/:articleId',
  ...authorMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const isAdmin = req.user!.role === UserRole.ADMIN;
      await deleteArticle(req.params.articleId, req.user!.id, isAdmin);
      sendSuccess(res, 200, 'Article deleted successfully');
    } catch (error) {
      next(error);
    }
  }
);

// ─── Comments: create (any approved authenticated user) ──────────────────────

articlesRouter.post(
  '/:articleId/comments',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user!.isApproved) {
        res.status(403).json({ success: false, code: 403, message: 'Forbidden', error: 'Account not approved' });
        return;
      }
      const input = validateCreateCommentInput(req.body);
      const comment = await createComment(req.params.articleId, req.user!.id, input);
      sendSuccess(res, 201, 'Comment created successfully', comment);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @openapi
 * /api/articles/{articleId}/comments/{commentId}:
 *   delete:
 *     tags: [Articles]
 *     summary: Удалить комментарий (свой или ADMIN)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: articleId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Комментарий удалён
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       403:
 *         description: Нет прав
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// Delete comment: own comment or ADMIN
articlesRouter.delete(
  '/:articleId/comments/:commentId',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const isAdmin = req.user!.role === UserRole.ADMIN;
      const comment = await deleteComment(req.params.commentId, req.user!.id, isAdmin);
      sendSuccess(res, 200, 'Comment deleted successfully', comment);
    } catch (error) {
      next(error);
    }
  }
);

// ─── Admin: all articles ──────────────────────────────────────────────────────

/**
 * @openapi
 * /api/articles/admin/all:
 *   get:
 *     tags: [Articles]
 *     summary: Получить все статьи включая черновики (ADMIN)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Все статьи
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Article'
 *       403:
 *         description: Нет прав
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
articlesRouter.get(
  '/admin/all',
  authenticate,
  requireRole(UserRole.ADMIN),
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const articles = await listAllArticles();
      sendSuccess(res, 200, 'All articles fetched successfully', articles);
    } catch (error) {
      next(error);
    }
  }
);

export default articlesRouter;
