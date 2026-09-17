import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let message = 'An unexpected internal error occurred.';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const obj = res as any;
        errorCode = obj.errorCode || obj.error || 'HTTP_ERROR';
        message = Array.isArray(obj.message) ? obj.message.join('; ') : (obj.message || message);
      }
    } else if (exception instanceof Error) {
      // Don't leak raw SQL or credentials
      console.error('[Unhandled Exception]:', exception.stack || exception.message);
      message = 'An unexpected error occurred processing the request.';
    }

    const requestId = (request.headers['x-request-id'] as string) || `req-${Date.now()}`;

    response.status(status).json({
      statusCode: status,
      errorCode,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId,
    });
  }
}

