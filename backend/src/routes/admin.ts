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

/**
 * @openapi
 * /api/admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: Получить список всех пользователей
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved]
 *         description: Фильтр по статусу одобрения
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Поиск по имени или email (case-insensitive)
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Фильтр по статусу бана (true = активен, false = заблокирован)
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [PATIENT, EDITOR, ADMIN]
 *         description: Фильтр по роли
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, fullName]
 *         description: Поле сортировки
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Направление сортировки
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Номер страницы
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           enum: [20, 50, 100]
 *         description: Размер страницы
 *     responses:
 *       200:
 *         description: Список пользователей
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
 *       403:
 *         description: Нет прав (требуется роль ADMIN)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   post:
 *     tags: [Admin]
 *     summary: Создать пользователя (администратором)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, role]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               fullName:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [PATIENT, EDITOR, ADMIN]
 *     responses:
 *       201:
 *         description: Пользователь создан
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       403:
 *         description: Нет прав
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
adminRouter.get('/users', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const search = typeof req.query.search === 'string' ? req.query.search.trim() || undefined : undefined;
    const isActiveRaw = typeof req.query.isActive === 'string' ? req.query.isActive : undefined;
    const isActive = isActiveRaw === 'true' ? true : isActiveRaw === 'false' ? false : undefined;
    const roleRaw = typeof req.query.role === 'string' ? req.query.role : undefined;
    const role = roleRaw && Object.values(UserRole).includes(roleRaw as UserRole) ? (roleRaw as UserRole) : undefined;
    const sortBy = req.query.sortBy === 'fullName' ? ('fullName' as const) : ('createdAt' as const);
    const sortOrder = req.query.sortOrder === 'asc' ? ('asc' as const) : ('desc' as const);
    const page = Math.max(1, parseInt(typeof req.query.page === 'string' ? req.query.page : '1', 10) || 1);
    const pageSizeRaw = parseInt(typeof req.query.pageSize === 'string' ? req.query.pageSize : '20', 10) || 20;
    const pageSize = ([20, 50, 100] as number[]).includes(pageSizeRaw) ? pageSizeRaw : 20;
    const result = await listUsers({ status, search, isActive, role, sortBy, sortOrder, page, pageSize });
    sendSuccess(res, 200, 'Users fetched successfully', result);
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

/**
 * @openapi
 * /api/admin/users/{userId}/approve:
 *   patch:
 *     tags: [Admin]
 *     summary: Одобрить регистрацию пользователя
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Пользователь одобрен
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       403:
 *         description: Нет прав
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Пользователь не найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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

/**
 * @openapi
 * /api/admin/users/{userId}/role:
 *   patch:
 *     tags: [Admin]
 *     summary: Изменить роль пользователя
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [PATIENT, EDITOR, ADMIN]
 *     responses:
 *       200:
 *         description: Роль обновлена
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       403:
 *         description: Нет прав
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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

/**
 * @openapi
 * /api/admin/users/{userId}/status:
 *   patch:
 *     tags: [Admin]
 *     summary: Изменить статус активности пользователя (блокировка/разблокировка)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [isActive]
 *             properties:
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Статус обновлён
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       403:
 *         description: Нет прав или попытка заблокировать себя
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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

/**
 * @openapi
 * /api/admin/audit-logs:
 *   get:
 *     tags: [Admin]
 *     summary: Получить журнал аудита
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 50
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [USER_APPROVED, USER_ROLE_CHANGED, USER_BLOCKED, USER_UNBLOCKED, USER_CREATED, ARTICLE_PUBLISHED, ARTICLE_UNPUBLISHED, PROFILE_NAME_UPDATED, PASSWORD_CHANGED]
 *         description: Фильтр по типу действия
 *       - in: query
 *         name: actorId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Фильтр по ID исполнителя
 *     responses:
 *       200:
 *         description: Журнал аудита с пагинацией
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         items:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/AuditLog'
 *                         total:
 *                           type: integer
 *                         page:
 *                           type: integer
 *                         pageSize:
 *                           type: integer
 *       403:
 *         description: Нет прав
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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
