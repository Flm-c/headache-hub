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

articlesRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = validateListPublicQuery(req.query);
    const result = await listPublishedArticles(query);
    sendSuccess(res, 200, 'Articles fetched successfully', result);
  } catch (error) {
    next(error);
  }
});

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
