import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Observable, throwError } from 'rxjs';

import { extractHttpErrorMessage } from '../errors/extract-http-error-message';
import { httpStatusToGrpcCode } from '../errors/http-status-to-grpc-code';

@Catch(HttpException)
export class HttpExceptionRpcFilter implements ExceptionFilter<HttpException> {
  catch(error: HttpException, _host: ArgumentsHost): Observable<never> {
    return throwError(
      () =>
        new RpcException({
          code: httpStatusToGrpcCode(error.getStatus()),
          message: extractHttpErrorMessage(error),
        }),
    );
  }
}
