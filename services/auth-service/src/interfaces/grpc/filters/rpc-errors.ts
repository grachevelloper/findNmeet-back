import { HttpException } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { Observable, throwError } from 'rxjs';

export function httpStatusToGrpcCode(httpStatus: number): status {
  switch (httpStatus) {
    case 400:
      return status.INVALID_ARGUMENT;
    case 401:
      return status.UNAUTHENTICATED;
    case 404:
      return status.NOT_FOUND;
    case 409:
      return status.ALREADY_EXISTS;
    default:
      return status.UNKNOWN;
  }
}

export function extractHttpErrorMessage(error: HttpException): string {
  const response = error.getResponse();

  if (typeof response === 'string') {
    return response;
  }

  if (typeof response === 'object' && response && 'message' in response) {
    const message = response.message;

    if (Array.isArray(message)) {
      return message.join(', ');
    }

    if (typeof message === 'string') {
      return message;
    }
  }

  return error.message;
}

export function httpExceptionToRpcException(error: HttpException): Observable<never> {
  return throwError(
    () =>
      new RpcException({
        code: httpStatusToGrpcCode(error.getStatus()),
        message: extractHttpErrorMessage(error),
      }),
  );
}
