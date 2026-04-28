import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { captureException } from './sentry.js';

@Catch()
export class SentryExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('SentryExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse();
    const req = ctx.getRequest();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    if (status >= 500) {
      captureException(exception, {
        tags: { route: req?.url, method: req?.method },
      });
    }

    if (exception instanceof HttpException) {
      const body = exception.getResponse();
      res.status(status).json(typeof body === 'string' ? { message: body } : body);
      return;
    }

    this.logger.error(exception);
    res.status(status).json({ message: 'Internal server error' });
  }
}
