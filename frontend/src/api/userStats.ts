import { apiClient } from './client';
import { ApiResponse } from '../types/auth';

export interface UserStats {
  userId: string;
  lastEpisodeDate: string | null;
  episodesThisMonth: number;
  episodesLastMonth: number;
  averageSeverity: number;
  updatedAt: string;
}

export const fetchUserStats = async (): Promise<UserStats | null> => {
  const response = await apiClient.get<ApiResponse<UserStats | null>>('/user-stats');
  return response.data.data ?? null;
};
