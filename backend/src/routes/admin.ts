import { Router, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import { AuthenticatedRequest } from '../types/auth';
import { sendError, sendSuccess } from '../utils/apiResponse';
import {
  approveUser,
  createUserByAdmin,
  listAuditLogs,
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
    const user = await createUserByAdmin(input, req.user!.id);
    sendSuccess(res, 201, 'User created successfully', user);
  } catch (error) {
    next(error);
  }
});

adminRouter.patch(
  '/users/:userId/approve',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = await approveUser(req.params.userId, req.user!.id);
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
      const user = await updateUserRole(req.params.userId, input.role, req.user!.id);
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
      const user = await updateUserStatus(req.params.userId, input.isActive, req.user!.id);
      sendSuccess(res, 200, 'User status updated successfully', user);
    } catch (error) {
      next(error);
    }
  }
);

adminRouter.get(
  '/audit-logs',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);
      const pageSize = Math.min(50, Math.max(1, parseInt(String(req.query.pageSize ?? '20'), 10) || 20));
      const action = typeof req.query.action === 'string' && req.query.action ? req.query.action : undefined;
      const actorId = typeof req.query.actorId === 'string' && req.query.actorId ? req.query.actorId : undefined;

      const result = await listAuditLogs({ page, pageSize, action, actorId });
      sendSuccess(res, 200, 'Audit logs fetched successfully', result);
    } catch (error) {
      next(error);
    }
  }
);

export default adminRouter;
