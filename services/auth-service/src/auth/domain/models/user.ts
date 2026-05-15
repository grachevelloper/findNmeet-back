import { UserStatus } from './user-status';

export type User = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt: Date;
  status: UserStatus;
};
