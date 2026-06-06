import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const { combine, timestamp, json, errors } = winston.format;

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
    json()
  ),
  defaultMeta: { service: 'meeting-intelligence-service' },
  transports: [
    new winston.transports.Console({
      format: combine(
        errors({ stack: true }),
        timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
        json()
      ),
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'app.log'),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    }),
  ],
});

export default logger;
