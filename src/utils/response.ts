import { Response } from 'express';

export const ok = (
  res: Response,
  data: unknown,
  statusCode = 200,
  traceId?: string
): Response => {
  return res.status(statusCode).json({
    traceId: traceId ?? null,
    success: true,
    data,
  });
};

export const fail = (
  res: Response,
  code: string,
  message: string,
  statusCode = 400,
  traceId?: string
): Response => {
  return res.status(statusCode).json({
    traceId: traceId ?? null,
    success: false,
    error: {
      code,
      message,
    },
  });
};

// keep old names for backwards compat with swagger/existing imports
export const successResponse = ok;
export const errorResponse = fail;
