import { prisma } from '../utils/prisma';

export interface UserStats {
  userId: string;
  lastEpisodeDate: Date | null;
  episodesThisMonth: number;
  episodesLastMonth: number;
  averageSeverity: number;
  updatedAt: Date;
}

export const recalcUserStats = (userId: string): void => {
  void (async () => {
    const now = new Date();

    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);

    const [episodesThisMonth, episodesLastMonth, allEpisodes] = await Promise.all([
      prisma.migraineEpisode.count({
        where: { userId, date: { gte: thisMonthStart } },
      }),
      prisma.migraineEpisode.count({
        where: { userId, date: { gte: lastMonthStart, lt: lastMonthEnd } },
      }),
      prisma.migraineEpisode.findMany({
        where: { userId },
        select: { severity: true, date: true },
        orderBy: { date: 'desc' },
      }),
    ]);

    const totalEpisodes = allEpisodes.length;
    const averageSeverity =
      totalEpisodes > 0
        ? Number(
            (allEpisodes.reduce((sum, ep) => sum + ep.severity, 0) / totalEpisodes).toFixed(2)
          )
        : 0;
    const lastEpisodeDate = allEpisodes[0]?.date ?? null;

    await prisma.userStatistics.upsert({
      where: { userId },
      create: {
        userId,
        episodesThisMonth,
        episodesLastMonth,
        averageSeverity,
        lastEpisodeDate,
      },
      update: {
        episodesThisMonth,
        episodesLastMonth,
        averageSeverity,
        lastEpisodeDate,
      },
    });
  })().catch(() => {});
};

export const getUserStats = async (userId: string): Promise<UserStats | null> => {
  return prisma.userStatistics.findUnique({ where: { userId } });
};
