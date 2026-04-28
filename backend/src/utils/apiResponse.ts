import { Response } from 'express';

interface ApiSuccess<T> {
  success: true;
  code: number;
  message: string;
  data?: T;
}

interface ApiFailure {
  success: false;
  code: number;
  message: string;
  error?: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export const sendSuccess = <T>(
  res: Response<ApiResponse<T>>,
  code: number,
  message: string,
  data?: T
): Response<ApiResponse<T>> => {
  return res.status(code).json({
    success: true,
    code,
    message,
    data,
  });
};

export const sendError = (
  res: Response<ApiResponse<null>>,
  code: number,
  message: string,
  error?: string
): Response<ApiResponse<null>> => {
  return res.status(code).json({
    success: false,
    code,
    message,
    error,
  });
};
