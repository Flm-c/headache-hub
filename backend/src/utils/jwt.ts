import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import { UserRole } from '@prisma/client';

export interface AccessTokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  isApproved: boolean;
}

export interface RefreshTokenPayload {
  userId: string;
}

const jwtSecret = process.env.JWT_SECRET;
const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;

if (!jwtSecret) {
  throw new Error('JWT_SECRET is required');
}

if (!jwtRefreshSecret) {
  throw new Error('JWT_REFRESH_SECRET is required');
}

export const signAccessToken = (payload: AccessTokenPayload): string => {
  const options: SignOptions = {
    expiresIn: (process.env.JWT_ACCESS_EXPIRATION || '15m') as SignOptions['expiresIn'],
  };

  return jwt.sign(payload, jwtSecret as Secret, options);
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  return jwt.verify(token, jwtSecret) as AccessTokenPayload;
};

export const signRefreshToken = (userId: string): string => {
  const options: SignOptions = {
    expiresIn: (process.env.JWT_REFRESH_EXPIRATION || '30d') as SignOptions['expiresIn'],
  };

  return jwt.sign({ userId }, jwtRefreshSecret as Secret, options);
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  return jwt.verify(token, jwtRefreshSecret as Secret) as RefreshTokenPayload;
};
