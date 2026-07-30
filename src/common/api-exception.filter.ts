import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';

interface ErrorResponse {
  statusCode: number;
  error: string;
  message: string | string[];
  path: string;
  timestamp: string;
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  public catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const request = host.switchToHttp().getRequest<{ url: string }>();
    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const body = exception instanceof HttpException ? exception.getResponse() : undefined;
    const details =
      typeof body === 'object' && body !== null
        ? (body as { error?: string; message?: string | string[] })
        : {};

    const payload: ErrorResponse = {
      statusCode: status,
      error: details.error ?? HttpStatus[status] ?? 'Error',
      message:
        details.message ??
        (exception instanceof Error ? exception.message : 'Erro interno inesperado'),
      path: request.url,
      timestamp: new Date().toISOString(),
    };
    response.status(status).json(payload);
  }
}
