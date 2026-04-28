import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import { AuthenticatedRequest } from '../types/auth';
import { sendSuccess } from '../utils/apiResponse';
import {
  getCurrentUser,
  loginUser,
  registerUser,
  validateLoginInput,
  validateRegisterInput,
} from '../services/authService';

const authRouter = Router();

authRouter.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = validateRegisterInput(req.body);
    const user = await registerUser(input);

    sendSuccess(res, 201, 'Account created successfully. Awaiting admin approval.', user);
  } catch (error) {
    next(error);
  }
});

authRouter.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = validateLoginInput(req.body);
    const result = await loginUser(input);

    sendSuccess(res, 200, 'Login successful', result);
  } catch (error) {
    next(error);
  }
});

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
