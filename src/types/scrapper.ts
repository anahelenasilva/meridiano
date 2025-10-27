export interface ScrapingStats {
  feedProfile: string;
  totalFeeds: number;
  newArticles: number;
  errors: number;
  startTime: Date;
  endTime?: Date;
}
