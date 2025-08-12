import { EventDocument } from '../../events/schemas/event.schema';

export class PaginationDto {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export class FeedResponseDto {
  events: EventDocument[];
  pagination: PaginationDto;
  noResultsReason?: 'no_matching_genres' | 'no_preferences' | null;
}