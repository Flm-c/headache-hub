import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { User } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { HttpError } from '../utils/httpError';
import { signAccessToken, signRefreshToken } from '../utils/jwt';

const registerSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters long').max(120),
  email: z.string().trim().email('Email must be valid').toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters long').max(128),
});

const loginSchema = z.object({
  email: z.string().trim().email('Email must be valid').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export interface SafeUser {
  id: string;
  email: string;
  fullName: string;
  role: User['role'];
  isApproved: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResult {
  user: SafeUser;
  token: string;
  refreshToken: string;
}

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

export const validateRegisterInput = (input: unknown): RegisterInput => registerSchema.parse(input);

export const validateLoginInput = (input: unknown): LoginInput => loginSchema.parse(input);

export const registerUser = async (input: RegisterInput): Promise<SafeUser> => {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existingUser) {
    throw new HttpError(409, 'Conflict', `Email '${input.email}' is already registered`);
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await prisma.user.create({
    data: {
      fullName: input.fullName,
      email: input.email,
      passwordHash,
    },
  });

  return toSafeUser(user);
};

export const loginUser = async (input: LoginInput): Promise<AuthResult> => {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user) {
    throw new HttpError(401, 'Authentication failed', 'Invalid email or password');
  }

  if (!user.isActive) {
    throw new HttpError(403, 'Forbidden', 'Your account is blocked. Please contact support.');
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);

  if (!passwordMatches) {
    throw new HttpError(401, 'Authentication failed', 'Invalid email or password');
  }

  const jti = randomUUID();
  const refreshExpiresMs = 30 * 24 * 60 * 60 * 1000; // 30 days
  const expiresAt = new Date(Date.now() + refreshExpiresMs);

  await prisma.refreshToken.create({ data: { jti, userId: user.id, expiresAt } });

  return {
    user: toSafeUser(user),
    token: signAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      isApproved: user.isApproved,
    }),
    refreshToken: signRefreshToken(user.id, jti),
  };
};

export const getCurrentUser = async (userId: string): Promise<SafeUser> => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new HttpError(404, 'Not Found', 'User does not exist');
  }

  return toSafeUser(user);
};
