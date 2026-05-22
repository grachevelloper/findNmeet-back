import { SearchCriteria } from '../../domain/models/search-criteria';

export type ParsedSearchQueryResult =
  | {
      status: 'PARSED';
      message: string;
      criteria: SearchCriteria;
    }
  | {
      status: 'NEEDS_CLARIFICATION';
      message: string;
      criteria: SearchCriteria;
    };
