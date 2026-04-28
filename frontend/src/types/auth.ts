export type UserRole = 'PATIENT' | 'EDITOR' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isApproved: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  code: number;
  message: string;
  data?: T;
  error?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
}

export interface AuthPayload {
  user: User;
  token: string;
  refreshToken?: string;
}

export interface AdminCreateUserRequest {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  isActive?: boolean;
}

export interface UpdateUserRoleRequest {
  role: UserRole;
}

export interface UpdateUserStatusRequest {
  isActive: boolean;
}

export interface AuditLogActor {
  id: string;
  fullName: string;
  email: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  changes: string | null;
  createdAt: string;
  user: AuditLogActor;
}

export interface AuditLogResult {
  logs: AuditLogEntry[];
  total: number;
  page: number;
  pageSize: number;
}
