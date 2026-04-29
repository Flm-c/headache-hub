import bcrypt from 'bcrypt';
import { Prisma, UserRole } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { HttpError } from '../utils/httpError';
import { logAudit } from '../utils/auditLog';

const createUserSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters long').max(120),
  email: z.string().trim().email('Email must be valid').toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters long').max(128),
  role: z.nativeEnum(UserRole),
  isActive: z.boolean().optional().default(true),
});

const updateRoleSchema = z.object({
  role: z.nativeEnum(UserRole),
});

const updateStatusSchema = z.object({
  isActive: z.boolean(),
});

export type AdminCreateUserInput = z.infer<typeof createUserSchema>;
export type AdminUpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type AdminUpdateStatusInput = z.infer<typeof updateStatusSchema>;

export const validateAdminCreateUserInput = (input: unknown): AdminCreateUserInput =>
  createUserSchema.parse(input);

export const validateAdminUpdateRoleInput = (input: unknown): AdminUpdateRoleInput =>
  updateRoleSchema.parse(input);

export const validateAdminUpdateStatusInput = (input: unknown): AdminUpdateStatusInput =>
  updateStatusSchema.parse(input);

export interface ListUsersParams {
  status?: string;
  search?: string;
  isActive?: boolean;
  role?: UserRole;
  sortBy?: 'createdAt' | 'fullName';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export const listUsers = async ({
  status,
  search,
  isActive,
  role,
  sortBy = 'createdAt',
  sortOrder = 'desc',
  page = 1,
  pageSize = 20,
}: ListUsersParams = {}) => {
  const where: Prisma.UserWhereInput = {};

  if (status === 'pending') where.isApproved = false;
  else if (status === 'approved') where.isApproved = true;

  if (isActive !== undefined) where.isActive = isActive;
  if (role) where.role = role;

  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { fullName: { contains: search, mode: 'insensitive' } },
    ];
  }

  const select = {
    id: true,
    email: true,
    fullName: true,
    role: true,
    isApproved: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
  };

  const orderBy: Prisma.UserOrderByWithRelationInput =
    sortBy === 'fullName' ? { fullName: sortOrder } : { createdAt: sortOrder };

  const skip = (page - 1) * pageSize;
  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({ where, select, orderBy, skip, take: pageSize }),
    prisma.user.count({ where }),
  ]);

  return { users, total, page, pageSize };
};

export const approveUser = async (userId: string, actorId: string) => {
  const existingUser = await prisma.user.findUnique({ where: { id: userId } });

  if (!existingUser) {
    throw new HttpError(404, 'Not Found', `User with ID '${userId}' does not exist`);
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { isApproved: true },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      isApproved: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  logAudit(actorId, 'USER_APPROVED', 'user', userId);
  return updated;
};

export const updateUserRole = async (userId: string, role: UserRole, actorId: string) => {
  const existingUser = await prisma.user.findUnique({ where: { id: userId } });

  if (!existingUser) {
    throw new HttpError(404, 'Not Found', `User with ID '${userId}' does not exist`);
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { role },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      isApproved: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  logAudit(actorId, 'USER_ROLE_CHANGED', 'user', userId, { from: existingUser.role, to: role });
  return updated;
};

export const updateUserStatus = async (userId: string, isActive: boolean, actorId: string) => {
  const existingUser = await prisma.user.findUnique({ where: { id: userId } });

  if (!existingUser) {
    throw new HttpError(404, 'Not Found', `User with ID '${userId}' does not exist`);
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { isActive },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      isApproved: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  logAudit(actorId, isActive ? 'USER_UNBLOCKED' : 'USER_BLOCKED', 'user', userId);
  return updated;
};

export const createUserByAdmin = async (input: AdminCreateUserInput, actorId: string) => {
  const existingUser = await prisma.user.findUnique({ where: { email: input.email } });

  if (existingUser) {
    throw new HttpError(409, 'Conflict', `Email '${input.email}' is already registered`);
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  const created = await prisma.user.create({
    data: {
      fullName: input.fullName,
      email: input.email,
      passwordHash,
      role: input.role,
      isApproved: true,
      isActive: input.isActive,
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      isApproved: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  logAudit(actorId, 'USER_CREATED', 'user', created.id, { role: input.role });
  return created;
};

// ─── Audit Log ────────────────────────────────────────────────────────────────

export const listAuditLogs = async (params: {
  page: number;
  pageSize: number;
  action?: string;
  actorId?: string;
}) => {
  const where = {
    ...(params.action ? { action: params.action } : {}),
    ...(params.actorId ? { userId: params.actorId } : {}),
  };

  const [logs, total] = await prisma.$transaction([
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { id: true, fullName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total, page: params.page, pageSize: params.pageSize };
};
