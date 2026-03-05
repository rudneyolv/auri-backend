import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const request = host.switchToHttp().getRequest<Request>();

    const isHttpException = exception instanceof HttpException;

    this.logger.error(
      `[${request.method}] ${request.url}`,
      exception instanceof Error
        ? exception.message
        : JSON.stringify(exception),
    );

    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const defaultMessage = 'Internal Server Error';
    const defaultError = 'Internal Server Error';

    let messages: string[] = [defaultMessage];
    let errorName = defaultError;

    if (isHttpException) {
      const responseData = exception.getResponse();

      if (typeof responseData === 'string') {
        messages = [responseData];
      }

      if (typeof responseData === 'object' && responseData !== null) {
        const { message, error } = responseData as Record<string, any>;

        if (Array.isArray(message)) {
          messages = message as string[];
        } else if (typeof message === 'string') {
          messages = [message];
        }

        if (typeof error === 'string') {
          errorName = error;
        }
      }
    }

    return response.status(status).json({
      messages: messages,
      error: errorName,
      statusCode: status,
    });
  }
}
