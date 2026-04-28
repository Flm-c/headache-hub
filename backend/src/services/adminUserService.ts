import bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { HttpError } from '../utils/httpError';

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

export const listUsers = async (status?: string) => {
  const where =
    status === 'pending'
      ? { isApproved: false }
      : status === 'approved'
        ? { isApproved: true }
        : undefined;

  return prisma.user.findMany({
    where,
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
    orderBy: { createdAt: 'desc' },
  });
};

export const approveUser = async (userId: string) => {
  const existingUser = await prisma.user.findUnique({ where: { id: userId } });

  if (!existingUser) {
    throw new HttpError(404, 'Not Found', `User with ID '${userId}' does not exist`);
  }

  return prisma.user.update({
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
};

export const updateUserRole = async (userId: string, role: UserRole) => {
  const existingUser = await prisma.user.findUnique({ where: { id: userId } });

  if (!existingUser) {
    throw new HttpError(404, 'Not Found', `User with ID '${userId}' does not exist`);
  }

  return prisma.user.update({
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
};

export const updateUserStatus = async (userId: string, isActive: boolean) => {
  const existingUser = await prisma.user.findUnique({ where: { id: userId } });

  if (!existingUser) {
    throw new HttpError(404, 'Not Found', `User with ID '${userId}' does not exist`);
  }

  return prisma.user.update({
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
};

export const createUserByAdmin = async (input: AdminCreateUserInput) => {
  const existingUser = await prisma.user.findUnique({ where: { email: input.email } });

  if (existingUser) {
    throw new HttpError(409, 'Conflict', `Email '${input.email}' is already registered`);
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  return prisma.user.create({
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
};
