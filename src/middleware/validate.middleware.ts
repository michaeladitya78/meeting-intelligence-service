import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';
import { fail } from '../utils/response';

export const validate =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const message = err.errors
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join('; ');
        fail(res, 'VALIDATION_ERROR', message, 400, req.traceId);
        return;
      }
      next(err);
    }
  };
