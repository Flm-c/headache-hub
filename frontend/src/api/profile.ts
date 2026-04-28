import { apiClient } from './client';
import { User } from '../types/auth';

export interface UpdateProfileRequest {
  fullName?: string;
  currentPassword?: string;
  newPassword?: string;
}

export const fetchProfile = async (): Promise<User> => {
  const res = await apiClient.get<{ data: User }>('/profile');
  return res.data.data;
};

export const updateProfile = async (payload: UpdateProfileRequest): Promise<User> => {
  const res = await apiClient.patch<{ data: User }>('/profile', payload);
  return res.data.data;
};
