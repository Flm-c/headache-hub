import { Router, Request, Response, NextFunction } from 'express';
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

    res.cookie(REFRESH_COOKIE, result.refreshToken, COOKIE_OPTIONS);
    sendSuccess(res, 200, 'Login successful', { user: result.user, token: result.token });
  } catch (error) {
    next(error);
  }
});

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

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, role: true, isApproved: true, isActive: true },
    });

    if (!user || !user.isActive) {
      res.clearCookie(REFRESH_COOKIE, { path: '/' });
      sendError(res, 401, 'Unauthorized', 'User not found or inactive');
      return;
    }

    const newAccessToken = signAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      isApproved: user.isApproved,
    });
    const newRefreshToken = signRefreshToken(user.id);

    res.cookie(REFRESH_COOKIE, newRefreshToken, COOKIE_OPTIONS);
    sendSuccess(res, 200, 'Token refreshed', { token: newAccessToken });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/logout', async (req: Request, res: Response) => {
  res.clearCookie(REFRESH_COOKIE, { path: '/' });
  sendSuccess(res, 200, 'Logged out successfully', null);
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
