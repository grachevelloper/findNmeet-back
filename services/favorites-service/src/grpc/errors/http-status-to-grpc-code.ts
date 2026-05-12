import { status } from '@grpc/grpc-js';

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
