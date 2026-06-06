import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { fail } from '../utils/response';

export interface JwtPayload {
  userId: string;
  email: string;
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      fail(res, 'UNAUTHORIZED', 'Unauthorized', 401, req.traceId);
      return;
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET || 'fallback-secret';

    const decoded = jwt.verify(token, secret) as JwtPayload;
    req.user = decoded;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      fail(res, 'TOKEN_EXPIRED', 'token expired', 401, req.traceId);
    } else if (err instanceof jwt.JsonWebTokenError) {
      fail(res, 'INVALID_TOKEN', 'invalid token', 401, req.traceId);
    } else {
      fail(res, 'UNAUTHORIZED', 'Unauthorized', 401, req.traceId);
    }
  }
};
