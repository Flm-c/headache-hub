export type ArticleStatus = 'DRAFT' | 'PUBLISHED';

export type UserRole = 'PATIENT' | 'EDITOR' | 'ADMIN';

export interface ArticleAuthor {
  id: string;
  fullName: string;
  role: UserRole;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  status: ArticleStatus;
  commentsEnabled: boolean;
  isPublic: boolean;
  createdAt: string;
  publishedAt: string | null;
  updatedAt: string;
  author: ArticleAuthor;
}

export interface ArticleWithContent extends Article {
  content: string;
}

export interface ArticleComment {
  id: string;
  content: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    fullName: string;
    role: UserRole;
  };
}

export interface ArticleListResult {
  items: Article[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateArticleRequest {
  title: string;
  content: string;
  excerpt?: string | null;
  commentsEnabled?: boolean;
}

export interface UpdateArticleRequest {
  title?: string;
  content?: string;
  excerpt?: string | null;
  commentsEnabled?: boolean;
}

export interface ArticleListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
}
