import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';
import { QueryFailedError, EntityNotFoundError, TypeORMError } from 'typeorm';

@Catch(TypeORMError)
export class TypeOrmExceptionFilter implements ExceptionFilter {
  catch(exception: TypeORMError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    switch (true) {
      case exception instanceof QueryFailedError:
        status = HttpStatus.BAD_REQUEST;
        message = 'Database query failed';
        if (exception.driverError.code === 'ER_DUP_ENTRY') {
          status = HttpStatus.CONFLICT;
          message = 'Email is already registered.';
        }
        break;
      case exception instanceof EntityNotFoundError:
        status = HttpStatus.NOT_FOUND;
        message = 'Entity not found';
        break;
      default:
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = 'Internal server error';
    }

    response.status(status).json({
      statusCode: status,
      message: message,
    });
  }
}

export class EmailAlreadyExistsException extends HttpException {
  constructor() {
    super('Email is already registered.', HttpStatus.CONFLICT);
  }
}

export class EntityNotFoundException extends HttpException {
  constructor() {
    super('The requested resource was not found.', HttpStatus.NOT_FOUND);
  }
}
