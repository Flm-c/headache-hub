import dotenv from 'dotenv';

dotenv.config();

import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import authRouter from './routes/auth';
import adminRouter from './routes/admin';
import episodesRouter from './routes/episodes';
import articlesRouter from './routes/articles';
import profileRouter from './routes/profile';
import userStatsRouter from './routes/userStats';
import { errorHandler } from './middleware/errorHandler';
import { prisma } from './utils/prisma';
import { sendError, sendSuccess } from './utils/apiResponse';
import { swaggerSpec } from './utils/swagger';

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(
  helmet({
    contentSecurityPolicy:
      process.env.NODE_ENV === 'production'
        ? {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'"], // required for Tiptap inline styles
              imgSrc: ["'self'", 'data:', 'https:'],   // allow external images in articles
              connectSrc: ["'self'"],
              fontSrc: ["'self'", 'https:', 'data:'],
              objectSrc: ["'none'"],
              frameSrc: ["'none'"],
              baseUri: ["'self'"],
            },
          }
        : false, // disable CSP in dev — Swagger UI requires inline scripts/styles
  })
);
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '500kb' }));
app.use(express.urlencoded({ extended: true, limit: '500kb' }));
app.use(cookieParser());

// CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Rate limiting — общий лимит
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

// Rate limiting — усиленный для auth (защита от брутфорса)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true,
});

// Rate limiting — запись контента (статьи): защита от спама и флудинга
const articlesWriteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Too many write operations, please try again later.',
  skip: (req) => req.method === 'GET' || req.method === 'OPTIONS',
});

// Rate limiting — админ панель: отдельный лимит поверх общего
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: 'Too many admin requests, please try again later.',
});

app.use('/api/', limiter);

// Swagger UI — только в development
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api/docs.json', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}

// Health check route
app.get('/health', (req: Request, res: Response) => {
  sendSuccess(res, 200, 'Server is running');
});

app.get('/api', (req: Request, res: Response) => {
  sendSuccess(res, 200, 'Headache Hub API v1.0');
});

app.use('/api/auth', authLimiter, authRouter);
app.use('/api/admin', adminLimiter, adminRouter);
app.use('/api/episodes', episodesRouter);
app.use('/api/articles', articlesWriteLimiter, articlesRouter);
app.use('/api/profile', profileRouter);
app.use('/api/user-stats', userStatsRouter);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req: Request, res: Response) => {
  sendError(res, 404, 'Not Found', `Route '${req.originalUrl}' does not exist`);
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected');

    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
      console.log(`📝 API available at http://localhost:${PORT}/api`);
      console.log(`� Swagger UI at http://localhost:${PORT}/api/docs`);
      console.log(`�💚 Health check at http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle shutdown
process.on('SIGTERM', async () => {
  console.log('💤 SIGTERM signal received: closing HTTP server');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
