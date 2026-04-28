import { Router, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import { AuthenticatedRequest } from '../types/auth';
import { sendError, sendSuccess } from '../utils/apiResponse';
import {
  approveUser,
  createUserByAdmin,
  listUsers,
  updateUserRole,
  updateUserStatus,
  validateAdminCreateUserInput,
  validateAdminUpdateRoleInput,
  validateAdminUpdateStatusInput,
} from '../services/adminUserService';

const adminRouter = Router();

adminRouter.use(authenticate, requireRole(UserRole.ADMIN));

adminRouter.get('/users', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const users = await listUsers(status);
    sendSuccess(res, 200, 'Users fetched successfully', users);
  } catch (error) {
    next(error);
  }
});

adminRouter.post('/users', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const input = validateAdminCreateUserInput(req.body);
    const user = await createUserByAdmin(input);
    sendSuccess(res, 201, 'User created successfully', user);
  } catch (error) {
    next(error);
  }
});

adminRouter.patch(
  '/users/:userId/approve',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = await approveUser(req.params.userId);
      sendSuccess(res, 200, 'User approved successfully', user);
    } catch (error) {
      next(error);
    }
  }
);

adminRouter.patch(
  '/users/:userId/role',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const input = validateAdminUpdateRoleInput(req.body);
      const user = await updateUserRole(req.params.userId, input.role);
      sendSuccess(res, 200, 'User role updated successfully', user);
    } catch (error) {
      next(error);
    }
  }
);

adminRouter.patch(
  '/users/:userId/status',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (req.params.userId === req.user!.id) {
        sendError(res, 403, 'Forbidden', 'You cannot change the status of your own account');
        return;
      }

      const input = validateAdminUpdateStatusInput(req.body);
      const user = await updateUserStatus(req.params.userId, input.isActive);
      sendSuccess(res, 200, 'User status updated successfully', user);
    } catch (error) {
      next(error);
    }
  }
);

export default adminRouter;
