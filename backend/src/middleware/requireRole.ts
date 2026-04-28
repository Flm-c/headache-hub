import { Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { AuthenticatedRequest } from '../types/auth';
import { sendError } from '../utils/apiResponse';

export const requireRole = (...roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 401, 'Unauthorized', 'Authentication required');
      return;
    }

    if (!roles.includes(req.user.role)) {
      sendError(res, 403, 'Forbidden', 'You do not have permission to perform this action');
      return;
    }

    next();
  };
};
