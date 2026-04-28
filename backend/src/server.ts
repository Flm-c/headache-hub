import dotenv from 'dotenv';

dotenv.config();

import express, { Request, Response } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import authRouter from './routes/auth';
import adminRouter from './routes/admin';
import { errorHandler } from './middleware/errorHandler';
import { prisma } from './utils/prisma';
import { sendError, sendSuccess } from './utils/apiResponse';

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

app.use('/api/', limiter);

// Health check route
app.get('/health', (req: Request, res: Response) => {
  sendSuccess(res, 200, 'Server is running');
});

app.get('/api', (req: Request, res: Response) => {
  sendSuccess(res, 200, 'Headache Hub API v1.0');
});

app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);

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
      console.log(`💚 Health check at http://localhost:${PORT}/health`);
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
