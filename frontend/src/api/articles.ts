import { AxiosError } from 'axios';
import { apiClient } from './client';
import {
  Article,
  ArticleComment,
  ArticleListQuery,
  ArticleListResult,
  ArticleWithContent,
  CreateArticleRequest,
  UpdateArticleRequest,
} from '../types/articles';

const getErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    const msg = error.response?.data?.error || error.response?.data?.message;
    if (typeof msg === 'string') return msg;
  }
  return error instanceof Error ? error.message : 'Unexpected request error';
};

const buildQueryString = (query: ArticleListQuery): string => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
};

// ─── Public ───────────────────────────────────────────────────────────────────

export const fetchPublishedArticles = async (
  query: ArticleListQuery = {}
): Promise<ArticleListResult> => {
  try {
    const res = await apiClient.get<{ data: ArticleListResult }>(
      `/articles${buildQueryString(query)}`
    );
    return res.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const fetchArticleBySlug = async (slug: string): Promise<ArticleWithContent> => {
  try {
    const res = await apiClient.get<{ data: ArticleWithContent }>(`/articles/slug/${slug}`);
    return res.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const fetchArticleComments = async (articleId: string): Promise<ArticleComment[]> => {
  try {
    const res = await apiClient.get<{ data: ArticleComment[] }>(
      `/articles/${articleId}/comments`
    );
    return res.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

// ─── Author (EDITOR/ADMIN) ────────────────────────────────────────────────────

export const fetchMyArticles = async (): Promise<Article[]> => {
  try {
    const res = await apiClient.get<{ data: Article[] }>('/articles/my');
    return res.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const fetchMyArticleById = async (articleId: string): Promise<ArticleWithContent> => {
  try {
    const res = await apiClient.get<{ data: ArticleWithContent }>(`/articles/my/${articleId}`);
    return res.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const createArticle = async (
  payload: CreateArticleRequest
): Promise<ArticleWithContent> => {
  try {
    const res = await apiClient.post<{ data: ArticleWithContent }>('/articles', payload);
    return res.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const updateArticle = async (
  articleId: string,
  payload: UpdateArticleRequest
): Promise<ArticleWithContent> => {
  try {
    const res = await apiClient.patch<{ data: ArticleWithContent }>(
      `/articles/${articleId}`,
      payload
    );
    return res.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const publishArticle = async (articleId: string): Promise<ArticleWithContent> => {
  try {
    const res = await apiClient.patch<{ data: ArticleWithContent }>(
      `/articles/${articleId}/publish`
    );
    return res.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const unpublishArticle = async (articleId: string): Promise<ArticleWithContent> => {
  try {
    const res = await apiClient.patch<{ data: ArticleWithContent }>(
      `/articles/${articleId}/unpublish`
    );
    return res.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const deleteArticle = async (articleId: string): Promise<void> => {
  try {
    await apiClient.delete(`/articles/${articleId}`);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

// ─── Comments ─────────────────────────────────────────────────────────────────

export const createComment = async (
  articleId: string,
  content: string
): Promise<ArticleComment> => {
  try {
    const res = await apiClient.post<{ data: ArticleComment }>(
      `/articles/${articleId}/comments`,
      { content }
    );
    return res.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const deleteComment = async (
  articleId: string,
  commentId: string
): Promise<void> => {
  try {
    await apiClient.delete(`/articles/${articleId}/comments/${commentId}`);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

// ─── Admin ────────────────────────────────────────────────────────────────────

export const fetchAllArticles = async (): Promise<Article[]> => {
  try {
    const res = await apiClient.get<{ data: Article[] }>('/articles/admin/all');
    return res.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};
