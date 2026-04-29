import { MigraineEpisode } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { HttpError } from '../utils/httpError';
import { recalcUserStats } from './userStatsService';

const createEpisodeSchema = z.object({
  date: z.coerce.date(),
  severity: z.number().int().min(1, 'Severity must be between 1 and 10').max(10),
  durationMinutes: z.number().int().min(1).max(7 * 24 * 60).nullable().optional(),
  location: z.string().trim().max(120).nullable().optional(),
  triggers: z.array(z.string().trim().min(1).max(80)).max(30).optional().default([]),
  notes: z.string().trim().max(4000).nullable().optional(),
});

const updateEpisodeSchema = createEpisodeSchema.partial().refine(
  (input) => Object.keys(input).length > 0,
  'At least one field must be provided for update'
);

const listEpisodesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

const statsQuerySchema = z.object({
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

export type CreateEpisodeInput = z.infer<typeof createEpisodeSchema>;
export type UpdateEpisodeInput = z.infer<typeof updateEpisodeSchema>;
export type ListEpisodesQueryInput = z.infer<typeof listEpisodesQuerySchema>;
export type EpisodeStatsQueryInput = z.infer<typeof statsQuerySchema>;

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
    dateFrom: Date | null;
    dateTo: Date | null;
  };
  totalEpisodes: number;
  averageSeverity: number;
  averageDurationMinutes: number;
  topTriggers: Array<{ trigger: string; count: number }>;
}

export const validateCreateEpisodeInput = (input: unknown): CreateEpisodeInput =>
  createEpisodeSchema.parse(input);

export const validateUpdateEpisodeInput = (input: unknown): UpdateEpisodeInput =>
  updateEpisodeSchema.parse(input);

export const validateListEpisodesQueryInput = (input: unknown): ListEpisodesQueryInput =>
  listEpisodesQuerySchema.parse(input);

export const validateEpisodeStatsQueryInput = (input: unknown): EpisodeStatsQueryInput =>
  statsQuerySchema.parse(input);

const buildDateRangeWhere = (dateFrom?: Date, dateTo?: Date) => {
  if (!dateFrom && !dateTo) {
    return undefined;
  }

  return {
    gte: dateFrom,
    lte: dateTo,
  };
};

export const createEpisode = async (userId: string, input: CreateEpisodeInput): Promise<MigraineEpisode> => {
  const episode = await prisma.migraineEpisode.create({
    data: {
      userId,
      date: input.date,
      severity: input.severity,
      durationMinutes: input.durationMinutes ?? null,
      location: input.location ?? null,
      triggers: input.triggers ?? [],
      notes: input.notes ?? null,
    },
  });
  recalcUserStats(userId);
  return episode;
};

export const listEpisodes = async (
  userId: string,
  query: ListEpisodesQueryInput
): Promise<EpisodeListResult> => {
  const where = {
    userId,
    date: buildDateRangeWhere(query.dateFrom, query.dateTo),
  };

  const [total, items] = await prisma.$transaction([
    prisma.migraineEpisode.count({ where }),
    prisma.migraineEpisode.findMany({
      where,
      orderBy: { date: 'desc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);

  return {
    items,
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    },
  };
};

export const getEpisodeById = async (userId: string, episodeId: string): Promise<MigraineEpisode> => {
  const episode = await prisma.migraineEpisode.findFirst({
    where: {
      id: episodeId,
      userId,
    },
  });

  if (!episode) {
    throw new HttpError(404, 'Not Found', `Episode with ID '${episodeId}' does not exist`);
  }

  return episode;
};

export const updateEpisode = async (
  userId: string,
  episodeId: string,
  input: UpdateEpisodeInput
): Promise<MigraineEpisode> => {
  const existingEpisode = await prisma.migraineEpisode.findFirst({
    where: {
      id: episodeId,
      userId,
    },
  });

  if (!existingEpisode) {
    throw new HttpError(404, 'Not Found', `Episode with ID '${episodeId}' does not exist`);
  }

  const updated = await prisma.migraineEpisode.update({
    where: { id: episodeId },
    data: {
      date: input.date,
      severity: input.severity,
      durationMinutes: input.durationMinutes,
      location: input.location,
      triggers: input.triggers,
      notes: input.notes,
    },
  });
  recalcUserStats(userId);
  return updated;
};

export const deleteEpisode = async (userId: string, episodeId: string): Promise<void> => {
  const existingEpisode = await prisma.migraineEpisode.findFirst({
    where: {
      id: episodeId,
      userId,
    },
  });

  if (!existingEpisode) {
    throw new HttpError(404, 'Not Found', `Episode with ID '${episodeId}' does not exist`);
  }

  await prisma.migraineEpisode.delete({
    where: { id: episodeId },
  });
  recalcUserStats(userId);
};

export const getEpisodeStats = async (
  userId: string,
  query: EpisodeStatsQueryInput
): Promise<EpisodeStatsResult> => {
  const where = {
    userId,
    date: buildDateRangeWhere(query.dateFrom, query.dateTo),
  };

  const episodes = await prisma.migraineEpisode.findMany({
    where,
    select: {
      severity: true,
      durationMinutes: true,
      triggers: true,
    },
  });

  const totalEpisodes = episodes.length;

  if (totalEpisodes === 0) {
    return {
      period: {
        dateFrom: query.dateFrom ?? null,
        dateTo: query.dateTo ?? null,
      },
      totalEpisodes: 0,
      averageSeverity: 0,
      averageDurationMinutes: 0,
      topTriggers: [],
    };
  }

  const severitySum = episodes.reduce((sum, episode) => sum + episode.severity, 0);
  const durationValues = episodes
    .map((episode) => episode.durationMinutes)
    .filter((value): value is number => typeof value === 'number');

  const durationSum = durationValues.reduce((sum, value) => sum + value, 0);

  const triggerCount = new Map<string, number>();
  for (const episode of episodes) {
    for (const trigger of episode.triggers) {
      const normalizedTrigger = trigger.trim();
      if (!normalizedTrigger) {
        continue;
      }

      triggerCount.set(normalizedTrigger, (triggerCount.get(normalizedTrigger) ?? 0) + 1);
    }
  }

  const topTriggers = Array.from(triggerCount.entries())
    .map(([trigger, count]) => ({ trigger, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    period: {
      dateFrom: query.dateFrom ?? null,
      dateTo: query.dateTo ?? null,
    },
    totalEpisodes,
    averageSeverity: Number((severitySum / totalEpisodes).toFixed(2)),
    averageDurationMinutes:
      durationValues.length > 0 ? Number((durationSum / durationValues.length).toFixed(2)) : 0,
    topTriggers,
  };
};

const escapeCsvField = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(';') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const CSV_SEP = ';';
const BOM = '\uFEFF';

export const exportEpisodesAsCsv = async (userId: string): Promise<string> => {
  const episodes = await prisma.migraineEpisode.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
  });

  const header = ['Date', 'Severity', 'Duration (min)', 'Location', 'Triggers', 'Notes'].join(CSV_SEP);
  const rows = episodes.map((ep) =>
    [
      escapeCsvField(ep.date.toISOString().slice(0, 10)),
      escapeCsvField(ep.severity),
      escapeCsvField(ep.durationMinutes),
      escapeCsvField(ep.location),
      escapeCsvField(ep.triggers.join(', ')),
      escapeCsvField(ep.notes),
    ].join(CSV_SEP)
  );

  return BOM + [header, ...rows].join('\r\n');
};