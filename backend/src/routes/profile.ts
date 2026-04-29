import { Router, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import { AuthenticatedRequest } from '../types/auth';
import { sendSuccess } from '../utils/apiResponse';
import { getProfile, updateProfile } from '../services/profileService';

const profileRouter = Router();

/**
 * @openapi
 * /api/profile:
 *   get:
 *     tags: [Profile]
 *     summary: Получить профиль текущего пользователя
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Профиль пользователя
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
 *   patch:
 *     tags: [Profile]
 *     summary: Обновить профиль (имя и/или пароль)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               currentPassword:
 *                 type: string
 *                 description: Обязателен при смене пароля
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Профиль обновлён
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         description: Ошибка валидации
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Не авторизован
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

// GET /api/profile — get own profile
profileRouter.get(
  '/',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const profile = await getProfile(req.user!.id);
      sendSuccess(res, 200, 'Profile fetched successfully', profile);
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /api/profile — update fullName and/or password
profileRouter.patch(
  '/',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const profile = await updateProfile(req.user!.id, req.body);
      sendSuccess(res, 200, 'Profile updated successfully', profile);
    } catch (error) {
      next(error);
    }
  }
);

export default profileRouter;
