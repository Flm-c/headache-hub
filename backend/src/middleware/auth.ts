import { Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { sendError } from '../utils/apiResponse';
import { verifyAccessToken } from '../utils/jwt';
import { AuthenticatedRequest } from '../types/auth';

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      sendError(res, 401, 'Unauthorized', 'Missing or invalid bearer token');
      return;
    }

    const token = authHeader.slice('Bearer '.length);
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isApproved: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      sendError(res, 401, 'Unauthorized', 'User is inactive or does not exist');
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    sendError(res, 401, 'Unauthorized', 'Token is invalid or expired');
  }
};
