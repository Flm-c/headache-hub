import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import { UserRole } from '@prisma/client';

export interface AccessTokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  isApproved: boolean;
}

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error('JWT_SECRET is required');
}

export const signAccessToken = (payload: AccessTokenPayload): string => {
  // TODO: add refresh token support here later when we move beyond MVP localStorage auth.
  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRATION || '7d') as SignOptions['expiresIn'],
  };

  return jwt.sign(payload, jwtSecret as Secret, options);
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  return jwt.verify(token, jwtSecret) as AccessTokenPayload;
};
