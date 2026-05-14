import { Injectable } from '@nestjs/common';

import type { GetExternalLinksQuery } from '../queries/get-external-links.query';
import { missingRequiredField } from '../errors/auth.errors';
import { ExternalLinkRepository } from '../../domain/ports/external-link.repository';

@Injectable()
export class GetExternalLinksUseCase {
  constructor(private readonly externalLinks: ExternalLinkRepository) {}

  async execute(query: GetExternalLinksQuery) {
    if (!query.userId) {
      throw missingRequiredField('user_id');
    }

    return this.externalLinks.findByUserId(query.userId);
  }
}
