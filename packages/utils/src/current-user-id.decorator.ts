import { createParamDecorator, ExecutionContext } from '@nestjs/common';

type RequestLike = {
  header?: (name: string) => string | undefined;
  headers?: Record<string, string | string[] | undefined>;
};

export const CurrentUserId = createParamDecorator((_data: unknown, ctx: ExecutionContext): string | undefined => {
  const request = ctx.switchToHttp().getRequest<RequestLike>();
  const header = request.header?.('x-user-id') ?? request.headers?.['x-user-id'];

  if (Array.isArray(header)) {
    return header[0];
  }

  return header || undefined;
});
