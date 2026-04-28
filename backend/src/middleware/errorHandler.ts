import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { sendError } from '../utils/apiResponse';
import { HttpError } from '../utils/httpError';

export const errorHandler = (
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (error instanceof ZodError) {
    const details = error.issues.map((issue) => issue.message).join(', ');
    sendError(res, 400, 'Validation error', details);
    return;
  }

  if (error instanceof HttpError) {
    sendError(res, error.statusCode, error.message, error.details);
    return;
  }

  const fallbackMessage = error instanceof Error ? error.message : 'Unknown server error';
  console.error('Unhandled error:', error);
  sendError(
    res,
    500,
    'Internal Server Error',
    process.env.NODE_ENV === 'development' ? fallbackMessage : 'An unexpected error occurred'
  );
};
