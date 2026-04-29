import { Router, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import { AuthenticatedRequest } from '../types/auth';
import { sendSuccess } from '../utils/apiResponse';
import { getUserStats } from '../services/userStatsService';

const userStatsRouter = Router();

userStatsRouter.use(authenticate);

/**
 * @openapi
 * /api/user-stats:
 *   get:
 *     tags: [User Stats]
 *     summary: Получить кэшированные агрегированные статистики пользователя
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Статистика пользователя
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/UserStats'
 *       401:
 *         description: Не авторизован
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
userStatsRouter.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const stats = await getUserStats(req.user!.id);
    sendSuccess(res, 200, 'User statistics fetched successfully', stats);
  } catch (error) {
    next(error);
  }
});

export default userStatsRouter;
