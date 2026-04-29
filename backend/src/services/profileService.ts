import bcrypt from 'bcrypt';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { HttpError } from '../utils/httpError';
import { SafeUser } from './authService';
import { User } from '@prisma/client';
import { logAudit } from '../utils/auditLog';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const updateProfileSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').max(120).optional(),
    currentPassword: z.string().optional(),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters')
      .max(128)
      .optional(),
  })
  .refine(
    (data) => {
      // If newPassword is provided, currentPassword must also be provided
      if (data.newPassword && !data.currentPassword) return false;
      return true;
    },
    { message: 'Current password is required when setting a new password', path: ['currentPassword'] }
  );

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const toSafeUser = (user: User): SafeUser => ({
  id: user.id,
  email: user.email,
  fullName: user.fullName,
  role: user.role,
  isApproved: user.isApproved,
  isActive: user.isActive,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

// ─── Service functions ────────────────────────────────────────────────────────

export const getProfile = async (userId: string): Promise<SafeUser> => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new HttpError(404, 'Not Found', 'User not found');
  return toSafeUser(user);
};

export const updateProfile = async (
  userId: string,
  rawInput: unknown
): Promise<SafeUser> => {
  const input = updateProfileSchema.parse(rawInput);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new HttpError(404, 'Not Found', 'User not found');

  const updateData: Partial<{ fullName: string; passwordHash: string }> = {};

  if (input.fullName !== undefined) {
    updateData.fullName = input.fullName;
  }

  if (input.newPassword) {
    const isMatch = await bcrypt.compare(input.currentPassword!, user.passwordHash);
    if (!isMatch) {
      throw new HttpError(400, 'Bad Request', 'Current password is incorrect');
    }
    updateData.passwordHash = await bcrypt.hash(input.newPassword, 12);
  }

  if (Object.keys(updateData).length === 0) {
    return toSafeUser(user);
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  if (input.fullName !== undefined) {
    logAudit(userId, 'PROFILE_NAME_UPDATED', 'user', userId);
  }
  if (input.newPassword) {
    logAudit(userId, 'PASSWORD_CHANGED', 'user', userId);
  }

  return toSafeUser(updated);
};
