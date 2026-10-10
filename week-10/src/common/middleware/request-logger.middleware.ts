import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { REQUEST_ID_HEADER } from './request-id.middleware.js';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const startedAt = Date.now();

    res.on('finish', () => {
      const durationMs = Date.now() - startedAt;
      const requestId = req.header(REQUEST_ID_HEADER) ?? 'unknown';
      this.logger.log(
        `${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs}ms requestId=${requestId}`,
      );
    });

    next();
  }
}
