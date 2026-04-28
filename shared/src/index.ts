// User types
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

// Migraine Episode types
export interface MigraineEpisode {
  id: string;
  userId: string;
  date: string;
  severity: number; // 1-10
  durationMinutes?: number;
  location?: string;
  triggers: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Article types
export type ArticleStatus = 'DRAFT' | 'PUBLISHED';

export interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  authorId: string;
  author?: User;
  status: ArticleStatus;
  commentsEnabled: boolean;
  isPublic: boolean;
  requiresSubscription: boolean;
  createdAt: string;
  publishedAt?: string;
  updatedAt: string;
}

export interface ArticleComment {
  id: string;
  articleId: string;
  userId: string;
  user?: User;
  content: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

// Subscription types
export interface UserSubscription {
  id: string;
  userId: string;
  isActive: boolean;
  stripeId?: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  code: number;
  message: string;
  data?: T;
  error?: string;
}

// Pagination
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

export interface AdminCreateUserRequest {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  isActive?: boolean;
}

export interface UpdateUserRoleRequest {
  role: UserRole;
}

export interface UpdateUserStatusRequest {
  isActive: boolean;
}
