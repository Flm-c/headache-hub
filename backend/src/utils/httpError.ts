export class HttpError extends Error {
  public readonly statusCode: number;
  public readonly details?: string;

  constructor(statusCode: number, message: string, details?: string) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.details = details;
  }
}
