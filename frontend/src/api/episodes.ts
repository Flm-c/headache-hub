import { AxiosError } from 'axios';
import { apiClient } from './client';
import { ApiResponse } from '../types/auth';
import {
  CreateEpisodeRequest,
  EpisodeListQuery,
  EpisodeListResult,
  EpisodeStatsQuery,
  EpisodeStatsResult,
  MigraineEpisode,
  UpdateEpisodeRequest,
} from '../types/episodes';

const getErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    const apiMessage = error.response?.data?.error || error.response?.data?.message;
    if (typeof apiMessage === 'string') {
      return apiMessage;
    }
  }

  return error instanceof Error ? error.message : 'Unexpected request error';
};

const buildQueryString = (query: EpisodeListQuery | EpisodeStatsQuery): string => {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  }

  const result = params.toString();
  return result ? `?${result}` : '';
};

export const fetchEpisodes = async (query: EpisodeListQuery = {}): Promise<EpisodeListResult> => {
  try {
    const queryString = buildQueryString(query);
    const response = await apiClient.get<ApiResponse<EpisodeListResult>>(`/episodes${queryString}`);

    if (!response.data.data) {
      throw new Error('Episodes response did not include data');
    }

    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const createEpisode = async (payload: CreateEpisodeRequest): Promise<MigraineEpisode> => {
  try {
    const response = await apiClient.post<ApiResponse<MigraineEpisode>>('/episodes', payload);

    if (!response.data.data) {
      throw new Error('Create episode response did not include data');
    }

    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const updateEpisode = async (
  episodeId: string,
  payload: UpdateEpisodeRequest
): Promise<MigraineEpisode> => {
  try {
    const response = await apiClient.patch<ApiResponse<MigraineEpisode>>(`/episodes/${episodeId}`, payload);

    if (!response.data.data) {
      throw new Error('Update episode response did not include data');
    }

    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const deleteEpisode = async (episodeId: string): Promise<void> => {
  try {
    await apiClient.delete<ApiResponse<null>>(`/episodes/${episodeId}`);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const fetchEpisodeStats = async (query: EpisodeStatsQuery = {}): Promise<EpisodeStatsResult> => {
  try {
    const queryString = buildQueryString(query);
    const response = await apiClient.get<ApiResponse<EpisodeStatsResult>>(`/episodes/stats${queryString}`);

    if (!response.data.data) {
      throw new Error('Episode stats response did not include data');
    }

    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const downloadEpisodesCsv = (): void => {
  const token = localStorage.getItem('headache-hub.access-token');
  const baseUrl = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:3000/api';
  const url = `${baseUrl}/episodes/export.csv?token=${encodeURIComponent(token ?? '')}`;

  const a = document.createElement('a');
  a.href = url;
  a.download = 'headache-episodes.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};