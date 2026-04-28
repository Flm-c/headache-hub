import { Router, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import { AuthenticatedRequest } from '../types/auth';
import { sendSuccess } from '../utils/apiResponse';
import {
  createEpisode,
  deleteEpisode,
  exportEpisodesAsCsv,
  getEpisodeById,
  getEpisodeStats,
  listEpisodes,
  updateEpisode,
  validateCreateEpisodeInput,
  validateEpisodeStatsQueryInput,
  validateListEpisodesQueryInput,
  validateUpdateEpisodeInput,
} from '../services/episodeService';

const episodesRouter = Router();

episodesRouter.use(authenticate);

episodesRouter.post('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const input = validateCreateEpisodeInput(req.body);
    const episode = await createEpisode(req.user!.id, input);
    sendSuccess(res, 201, 'Episode created successfully', episode);
  } catch (error) {
    next(error);
  }
});

episodesRouter.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const query = validateListEpisodesQueryInput(req.query);
    const episodes = await listEpisodes(req.user!.id, query);
    sendSuccess(res, 200, 'Episodes fetched successfully', episodes);
  } catch (error) {
    next(error);
  }
});

episodesRouter.get('/stats', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const query = validateEpisodeStatsQueryInput(req.query);
    const stats = await getEpisodeStats(req.user!.id, query);
    sendSuccess(res, 200, 'Episode statistics fetched successfully', stats);
  } catch (error) {
    next(error);
  }
});

episodesRouter.get('/export.csv', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const csv = await exportEpisodesAsCsv(req.user!.id);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="headache-episodes.csv"');
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

episodesRouter.get('/:episodeId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const episode = await getEpisodeById(req.user!.id, req.params.episodeId);
    sendSuccess(res, 200, 'Episode fetched successfully', episode);
  } catch (error) {
    next(error);
  }
});

episodesRouter.patch(
  '/:episodeId',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const input = validateUpdateEpisodeInput(req.body);
      const episode = await updateEpisode(req.user!.id, req.params.episodeId, input);
      sendSuccess(res, 200, 'Episode updated successfully', episode);
    } catch (error) {
      next(error);
    }
  }
);

episodesRouter.delete(
  '/:episodeId',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await deleteEpisode(req.user!.id, req.params.episodeId);
      sendSuccess(res, 200, 'Episode deleted successfully');
    } catch (error) {
      next(error);
    }
  }
);

export default episodesRouter;