import { AxiosError } from 'axios';
import { apiClient } from './client';
import {
  AdminCreateUserRequest,
  ApiResponse,
  AuditLogResult,
  UpdateUserRoleRequest,
  UpdateUserStatusRequest,
  User,
} from '../types/auth';

const getErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    const apiMessage = error.response?.data?.error || error.response?.data?.message;
    if (typeof apiMessage === 'string') {
      return apiMessage;
    }
  }

  return error instanceof Error ? error.message : 'Unexpected request error';
};

export const fetchAdminUsers = async (status: 'all' | 'pending' | 'approved'): Promise<User[]> => {
  try {
    const query = status === 'all' ? '' : `?status=${status}`;
    const response = await apiClient.get<ApiResponse<User[]>>(`/admin/users${query}`);

    return response.data.data || [];
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const approveAdminUser = async (userId: string): Promise<User> => {
  try {
    const response = await apiClient.patch<ApiResponse<User>>(`/admin/users/${userId}/approve`);

    if (!response.data.data) {
      throw new Error('Approve response did not include user data');
    }

    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const updateAdminUserRole = async (
  userId: string,
  payload: UpdateUserRoleRequest
): Promise<User> => {
  try {
    const response = await apiClient.patch<ApiResponse<User>>(`/admin/users/${userId}/role`, payload);

    if (!response.data.data) {
      throw new Error('Update role response did not include user data');
    }

    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const updateAdminUserStatus = async (
  userId: string,
  payload: UpdateUserStatusRequest
): Promise<User> => {
  try {
    const response = await apiClient.patch<ApiResponse<User>>(`/admin/users/${userId}/status`, payload);

    if (!response.data.data) {
      throw new Error('Update status response did not include user data');
    }

    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const createAdminUser = async (payload: AdminCreateUserRequest): Promise<User> => {
  try {
    const response = await apiClient.post<ApiResponse<User>>('/admin/users', payload);

    if (!response.data.data) {
      throw new Error('Create user response did not include user data');
    }

    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const fetchAuditLogs = async (params: {
  page?: number;
  pageSize?: number;
  action?: string;
}): Promise<AuditLogResult> => {
  try {
    const q = new URLSearchParams();
    if (params.page) q.set('page', String(params.page));
    if (params.pageSize) q.set('pageSize', String(params.pageSize));
    if (params.action) q.set('action', params.action);

    const response = await apiClient.get<ApiResponse<AuditLogResult>>(`/admin/audit-logs?${q}`);

    if (!response.data.data) {
      throw new Error('Audit logs response did not include data');
    }

    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};
