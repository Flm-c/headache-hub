import { AxiosError } from 'axios';
import { apiClient } from './client';
import { ApiResponse, AuthPayload, LoginRequest, RegisterRequest, User } from '../types/auth';

const getErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    const apiMessage = error.response?.data?.error || error.response?.data?.message;
    if (typeof apiMessage === 'string') {
      return apiMessage;
    }
  }

  return error instanceof Error ? error.message : 'Unexpected request error';
};

export const registerAccount = async (payload: RegisterRequest): Promise<User> => {
  try {
    const response = await apiClient.post<ApiResponse<User>>('/auth/register', payload);

    if (!response.data.data) {
      throw new Error('Registration response did not include a user');
    }

    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const loginAccount = async (payload: LoginRequest): Promise<AuthPayload> => {
  try {
    const response = await apiClient.post<ApiResponse<AuthPayload>>('/auth/login', payload);

    if (!response.data.data) {
      throw new Error('Login response did not include auth data');
    }

    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const fetchCurrentUser = async (): Promise<User> => {
  try {
    const response = await apiClient.get<ApiResponse<User>>('/auth/me');

    if (!response.data.data) {
      throw new Error('Current user response did not include user data');
    }

    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const logoutAccount = async (): Promise<void> => {
  try {
    await apiClient.post('/auth/logout');
  } catch {
    // best-effort: clear cookie on server, ignore errors
  }
};

// Silently refresh access token using the httpOnly refresh cookie.
// Called on page load to restore session without requiring re-login.
export const silentRefresh = async (): Promise<string> => {
  const response = await apiClient.post<ApiResponse<{ token: string }>>('/auth/refresh');
  const token = response.data.data?.token;
  if (!token) {
    throw new Error('Refresh response did not include token');
  }
  return token;
};
