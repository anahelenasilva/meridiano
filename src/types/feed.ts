export type FeedProfile = 'default' | 'technology' | 'politics' | 'business' | 'health' | 'science' | 'brasil' | string;

export interface RSSFeed {
  url: string;
  name: string;
  category?: string;
  description?: string;
  enabled?: boolean;
}

export interface FeedConfiguration {
  profile: FeedProfile;
  rssFeeds: RSSFeed[];
  prompts?: {
    articleSummary?: string;
    impactRating?: string;
    clusterAnalysis?: string;
    briefSynthesis?: string;
  };
  settings?: {
    priority?: number;
    enabled?: boolean;
  };
}
