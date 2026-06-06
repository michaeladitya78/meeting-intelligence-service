import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';
import { fail } from '../utils/response';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR'
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  const traceId = req.traceId || 'unknown';

  logger.error(err.message, {
    stack: err.stack,
    traceId,
    method: req.method,
    path: req.path,
    statusCode: err instanceof AppError ? err.statusCode : 500,
  });

  if (err instanceof AppError) {
    fail(res, err.code, err.message, err.statusCode, traceId);
    return;
  }

  // map common Prisma errors to friendly responses
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaErr = err as unknown as { code: string };
    if (prismaErr.code === 'P2002') {
      fail(res, 'DUPLICATE_ENTRY', 'A record with this value already exists', 409, traceId);
      return;
    }
    if (prismaErr.code === 'P2025') {
      fail(res, 'NOT_FOUND', 'not found', 404, traceId);
      return;
    }
  }

  fail(
    res,
    'INTERNAL_SERVER_ERROR',
    process.env.NODE_ENV === 'production' ? 'something went wrong' : err.message,
    500,
    traceId
  );
};
