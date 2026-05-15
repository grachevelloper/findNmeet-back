import type { Request } from 'express';

export type RequestAuthContext = {
  userId: string;
  roles: string[];
};

export type AuthenticatedRequest = Request & {
  auth?: RequestAuthContext;
};
