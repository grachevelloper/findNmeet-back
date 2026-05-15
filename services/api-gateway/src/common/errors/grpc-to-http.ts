import { BadGatewayException, BadRequestException, ConflictException, ForbiddenException, GatewayTimeoutException, InternalServerErrorException, NotFoundException, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { status as grpcStatus } from '@grpc/grpc-js';

type GrpcLikeError = {
  code?: number;
  details?: string;
  message?: string;
};

export function grpcToHttpError(error: unknown): Error {
  const nextError = error as GrpcLikeError;
  const message = nextError.details || nextError.message || 'Internal service request failed';

  switch (nextError.code) {
    case grpcStatus.INVALID_ARGUMENT:
      return new BadRequestException(message);
    case grpcStatus.NOT_FOUND:
      return new NotFoundException(message);
    case grpcStatus.ALREADY_EXISTS:
      return new ConflictException(message);
    case grpcStatus.PERMISSION_DENIED:
      return new ForbiddenException(message);
    case grpcStatus.UNAUTHENTICATED:
      return new UnauthorizedException(message);
    case grpcStatus.FAILED_PRECONDITION:
      return new BadRequestException(message);
    case grpcStatus.DEADLINE_EXCEEDED:
      return new GatewayTimeoutException(message);
    case grpcStatus.UNAVAILABLE:
      return new ServiceUnavailableException(message);
    case grpcStatus.INTERNAL:
      return new BadGatewayException(message);
    default:
      return new InternalServerErrorException(message);
  }
}
