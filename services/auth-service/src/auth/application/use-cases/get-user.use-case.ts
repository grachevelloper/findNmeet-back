import { Injectable } from '@nestjs/common';

import type { AuthenticatedUserResult } from '../dto/authenticated-user.result';
import type { GetUserQuery } from '../queries/get-user.query';
import { missingRequiredField, userNotFound } from '../errors/auth.errors';
import { ExternalLinkRepository } from '../../domain/ports/external-link.repository';
import { UserRepository } from '../../domain/ports/user.repository';

@Injectable()
export class GetUserUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly externalLinks: ExternalLinkRepository,
  ) {}

  async execute(query: GetUserQuery): Promise<AuthenticatedUserResult> {
    if (!query.userId) {
      throw missingRequiredField('user_id');
    }

    const user = await this.users.findById(query.userId);
    if (!user) {
      throw userNotFound();
    }

    const externalLinks = await this.externalLinks.findByUserId(query.userId);
    return { user, externalLinks };
  }
}
