// Database Article Interface
export interface DBArticle {
  id: number;
  url: string;
  title: string;
  published_date: Date;
  feed_source: string;
  raw_content: string;
  processed_content?: string;
  embedding?: string; // JSON string
  impact_rating?: number;
  feed_profile: string;
  image_url?: string;
  created_at: Date;
}

// Article Content Interface
export interface ArticleContent {
  content: string | null;
  ogImage: string | null;
}

// Cluster Analysis Interface
export interface ClusterAnalysis {
  topic: string;
  analysis: string;
  size: number;
  articles?: DBArticle[];
}

// Scraping Statistics Interface
export interface ScrapingStats {
  feedProfile: string;
  totalFeeds: number;
  newArticles: number;
  errors: number;
  startTime: Date;
  endTime?: Date;
}
