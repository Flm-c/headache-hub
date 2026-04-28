import { Request } from 'express';
import { UserRole } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isApproved: boolean;
  isActive: boolean;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}
