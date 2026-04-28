export interface MigraineEpisode {
  id: string;
  userId: string;
  date: string;
  severity: number;
  durationMinutes: number | null;
  location: string | null;
  triggers: string[];
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EpisodeListResult {
  items: MigraineEpisode[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface EpisodeStatsResult {
  period: {
    dateFrom: string | null;
    dateTo: string | null;
  };
  totalEpisodes: number;
  averageSeverity: number;
  averageDurationMinutes: number;
  topTriggers: Array<{
    trigger: string;
    count: number;
  }>;
}

export interface CreateEpisodeRequest {
  date: string;
  severity: number;
  durationMinutes?: number | null;
  location?: string | null;
  triggers?: string[];
  notes?: string | null;
}

export interface UpdateEpisodeRequest {
  date?: string;
  severity?: number;
  durationMinutes?: number | null;
  location?: string | null;
  triggers?: string[];
  notes?: string | null;
}

export interface EpisodeListQuery {
  page?: number;
  pageSize?: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface EpisodeStatsQuery {
  dateFrom?: string;
  dateTo?: string;
}