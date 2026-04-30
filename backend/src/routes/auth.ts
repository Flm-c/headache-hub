import { Router, Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { authenticate } from '../middleware/auth';
import { AuthenticatedRequest } from '../types/auth';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { prisma } from '../utils/prisma';
import {
  getCurrentUser,
  loginUser,
  registerUser,
  validateLoginInput,
  validateRegisterInput,
} from '../services/authService';

const REFRESH_COOKIE = 'headache-hub.refresh-token';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in ms
  path: '/',
};

const authRouter = Router();

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Регистрация нового пользователя
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               fullName:
 *                 type: string
 *     responses:
 *       201:
 *         description: Аккаунт создан, ожидает одобрения администратора
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Ошибка валидации
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
authRouter.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = validateRegisterInput(req.body);
    const user = await registerUser(input);

    sendSuccess(res, 201, 'Account created successfully. Awaiting admin approval.', user);
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Вход в систему
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Успешный вход. Устанавливает httpOnly-куку с refresh-токеном
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
 *                         user:
 *                           $ref: '#/components/schemas/User'
 *                         token:
 *                           type: string
 *                           description: JWT access-токен (15 минут)
 *       401:
 *         description: Неверные учётные данные
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
authRouter.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = validateLoginInput(req.body);
    const result = await loginUser(input);

    res.cookie(REFRESH_COOKIE, result.refreshToken, COOKIE_OPTIONS);
    sendSuccess(res, 200, 'Login successful', { user: result.user, token: result.token });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Обновление access-токена по refresh-кукe
 *     security: []
 *     responses:
 *       200:
 *         description: Новый access-токен выдан, refresh-кука обновлена
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
 *                         token:
 *                           type: string
 *       401:
 *         description: Refresh-токен отсутствует или истёк
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
authRouter.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.cookies?.[REFRESH_COOKIE] as string | undefined;

    if (!refreshToken) {
      sendError(res, 401, 'Unauthorized', 'Refresh token missing');
      return;
    }

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      res.clearCookie(REFRESH_COOKIE, { path: '/' });
      sendError(res, 401, 'Unauthorized', 'Refresh token invalid or expired');
      return;
    }

    // Проверяем jti в БД
    // Guard: токены без jti (старый формат до внедрения ротации) — отклоняем
    if (!payload.jti) {
      res.clearCookie(REFRESH_COOKIE, { path: '/' });
      sendError(res, 401, 'Unauthorized', 'Refresh token invalid or revoked');
      return;
    }

    const storedToken = await prisma.refreshToken.findUnique({ where: { jti: payload.jti } });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      // Токен не найден или истёк — возможная атака повторного использования
      // Инвалидируем все refresh-токены пользователя
      await prisma.refreshToken.deleteMany({ where: { userId: payload.userId } });
      res.clearCookie(REFRESH_COOKIE, { path: '/' });
      sendError(res, 401, 'Unauthorized', 'Refresh token invalid or revoked');
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, role: true, isApproved: true, isActive: true },
    });

    if (!user || !user.isActive) {
      await prisma.refreshToken.deleteMany({ where: { userId: payload.userId } });
      res.clearCookie(REFRESH_COOKIE, { path: '/' });
      sendError(res, 401, 'Unauthorized', 'User not found or inactive');
      return;
    }

    // Ротация: удаляем старый, создаём новый
    const newJti = randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.delete({ where: { jti: payload.jti } });
    await prisma.refreshToken.create({ data: { jti: newJti, userId: user.id, expiresAt } });

    const newAccessToken = signAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      isApproved: user.isApproved,
    });
    const newRefreshToken = signRefreshToken(user.id, newJti);

    res.cookie(REFRESH_COOKIE, newRefreshToken, COOKIE_OPTIONS);
    sendSuccess(res, 200, 'Token refreshed', { token: newAccessToken });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/logout', async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.[REFRESH_COOKIE] as string | undefined;

  if (refreshToken) {
    try {
      const payload = verifyRefreshToken(refreshToken);
      await prisma.refreshToken.deleteMany({ where: { jti: payload.jti } });
    } catch {
      // токен невалидный — просто очищаем куку
    }
  }

  res.clearCookie(REFRESH_COOKIE, { path: '/' });
  sendSuccess(res, 200, 'Logged out successfully', null);
});

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Выход из системы
 *     security: []
 *     responses:
 *       200:
 *         description: Refresh-кука очищена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Получить текущего авторизованного пользователя
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Данные текущего пользователя
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Не авторизован
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
authRouter.get(
  '/me',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = await getCurrentUser(req.user!.id);
      sendSuccess(res, 200, 'Current user fetched successfully', user);
    } catch (error) {
      next(error);
    }
  }
);

export default authRouter;
