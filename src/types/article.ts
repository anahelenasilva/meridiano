export interface PaginatedArticleInput {
  page?: number;
  perPage?: number;
  sortBy?: string;
  direction?: 'asc' | 'desc';
  feedProfile?: string;
  searchTerm?: string;
  startDate?: string;
  endDate?: string;
}

export interface CountTotalArticlesInput {
  feedProfile?: string;
  searchTerm?: string;
  startDate?: string;
  endDate?: string;
}
