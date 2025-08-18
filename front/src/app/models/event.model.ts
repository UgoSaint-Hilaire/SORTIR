export interface EventImage {
  url: string;
  width: number;
  height: number;
  ratio?: string;
}

export interface EventDate {
  localDate: string;
  localTime?: string;
  dateTime?: string;
}

export interface EventVenue {
  id?: string;
  name: string;
  type?: string;
  url?: string;
  locale?: string;
  city?: string;
  country?: string;
  countryCode?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  images?: EventImage[];
}

export interface PriceRange {
  min?: number;
  max?: number;
  currency?: string;
}

export interface EventSales {
  public?: any;
  presales?: any;
}

export interface Event {
  _id?: string;
  ticketmasterId: string;
  name: string;
  description?: string;
  url: string;
  images?: EventImage[];
  date: EventDate;
  venue?: EventVenue;
  segment: string;
  genre?: string;
  subGenre?: string;
  priceRange?: PriceRange;
  sales?: EventSales;
  status?: string;
  syncedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeedData {
  events: Event[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

export interface FeedResponse {
  success: boolean;
  code: number;
  message: string;
  data: FeedData;
}
