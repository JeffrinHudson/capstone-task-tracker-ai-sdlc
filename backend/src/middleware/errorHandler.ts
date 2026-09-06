import { ErrorRequestHandler } from 'express';

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly fields?: Record<string, string>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

function toPublicErrorMessage(err: AppError): string {
  // Phase 4 requirement: 400/404 => { error: string }
  // Prefer message, fall back to code.
  return err.message || err.code || 'Bad Request';
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: toPublicErrorMessage(err) });
    return;
  }

  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
};
