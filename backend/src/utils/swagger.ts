import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Headache Hub API',
      version: '1.0.0',
      description:
        'REST API для приложения отслеживания мигреней Headache Hub. ' +
        'Все защищённые эндпоинты требуют JWT в заголовке `Authorization: Bearer <token>`.',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Local development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            code: { type: 'integer' },
            message: { type: 'string' },
            data: {},
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            code: { type: 'integer' },
            error: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                detail: { type: 'string' },
              },
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            fullName: { type: 'string', nullable: true },
            role: { type: 'string', enum: ['PATIENT', 'EDITOR', 'ADMIN'] },
            isApproved: { type: 'boolean' },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        MigraineEpisode: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            date: { type: 'string', format: 'date-time' },
            severity: { type: 'integer', minimum: 1, maximum: 10 },
            duration: { type: 'integer', description: 'Продолжительность в минутах', nullable: true },
            triggers: { type: 'array', items: { type: 'string' }, nullable: true },
            notes: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Article: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            slug: { type: 'string' },
            content: { type: 'string', description: 'HTML-контент (Tiptap)' },
            isPublished: { type: 'boolean' },
            authorId: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        ArticleComment: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            content: { type: 'string' },
            articleId: { type: 'string', format: 'uuid' },
            authorId: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        AuditLog: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            action: { type: 'string' },
            actorId: { type: 'string', format: 'uuid' },
            targetId: { type: 'string', format: 'uuid', nullable: true },
            meta: { type: 'object', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        UserStats: {
          type: 'object',
          properties: {
            episodesThisMonth: { type: 'integer' },
            episodesLastMonth: { type: 'integer' },
            averageSeverity: { type: 'number', format: 'float', nullable: true },
            lastEpisodeDate: { type: 'string', format: 'date-time', nullable: true },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [
    path.join(__dirname, '../routes/*.ts'),
    path.join(__dirname, '../routes/*.js'),
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
