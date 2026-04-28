import { Router, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import { AuthenticatedRequest } from '../types/auth';
import { sendSuccess } from '../utils/apiResponse';
import { getProfile, updateProfile } from '../services/profileService';

const profileRouter = Router();

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
