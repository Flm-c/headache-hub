import { Router, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import { AuthenticatedRequest } from '../types/auth';
import { sendSuccess } from '../utils/apiResponse';
import { getUserStats } from '../services/userStatsService';

const userStatsRouter = Router();

userStatsRouter.use(authenticate);

userStatsRouter.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const stats = await getUserStats(req.user!.id);
    sendSuccess(res, 200, 'User statistics fetched successfully', stats);
  } catch (error) {
    next(error);
  }
});

export default userStatsRouter;
