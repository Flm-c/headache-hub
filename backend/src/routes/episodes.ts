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

/**
 * @openapi
 * /api/episodes:
 *   post:
 *     tags: [Episodes]
 *     summary: Создать запись о приступе мигрени
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [date, severity]
 *             properties:
 *               date:
 *                 type: string
 *                 format: date-time
 *               severity:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *               duration:
 *                 type: integer
 *                 description: Продолжительность в минутах
 *               triggers:
 *                 type: array
 *                 items:
 *                   type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Эпизод создан
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/MigraineEpisode'
 *       400:
 *         description: Ошибка валидации
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Не авторизован
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
episodesRouter.post('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const input = validateCreateEpisodeInput(req.body);
    const episode = await createEpisode(req.user!.id, input);
    sendSuccess(res, 201, 'Episode created successfully', episode);
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/episodes:
 *   get:
 *     tags: [Episodes]
 *     summary: Получить список эпизодов текущего пользователя
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Фильтр по дате начала (ISO 8601)
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: Фильтр по дате конца (ISO 8601)
 *     responses:
 *       200:
 *         description: Список эпизодов
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         items:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/MigraineEpisode'
 *                         total:
 *                           type: integer
 *       401:
 *         description: Не авторизован
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
episodesRouter.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const query = validateListEpisodesQueryInput(req.query);
    const episodes = await listEpisodes(req.user!.id, query);
    sendSuccess(res, 200, 'Episodes fetched successfully', episodes);
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/episodes/stats:
 *   get:
 *     tags: [Episodes]
 *     summary: Статистика эпизодов по периодам
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Статистика
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Не авторизован
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
episodesRouter.get('/stats', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const query = validateEpisodeStatsQueryInput(req.query);
    const stats = await getEpisodeStats(req.user!.id, query);
    sendSuccess(res, 200, 'Episode statistics fetched successfully', stats);
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/episodes/export.csv:
 *   get:
 *     tags: [Episodes]
 *     summary: Экспорт эпизодов в CSV
 *     description: Возвращает CSV-файл с разделителем `;` (UTF-8 BOM). Авторизация через query-параметр `token`.
 *     security: []
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: JWT access-токен
 *     responses:
 *       200:
 *         description: CSV-файл
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Не авторизован
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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

/**
 * @openapi
 * /api/episodes/{episodeId}:
 *   get:
 *     tags: [Episodes]
 *     summary: Получить конкретный эпизод по ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: episodeId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Эпизод найден
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/MigraineEpisode'
 *       404:
 *         description: Эпизод не найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   patch:
 *     tags: [Episodes]
 *     summary: Обновить эпизод
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: episodeId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date-time
 *               severity:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *               duration:
 *                 type: integer
 *               triggers:
 *                 type: array
 *                 items:
 *                   type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Эпизод обновлён
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/MigraineEpisode'
 *       404:
 *         description: Эпизод не найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   delete:
 *     tags: [Episodes]
 *     summary: Удалить эпизод
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: episodeId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Эпизод удалён
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Эпизод не найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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