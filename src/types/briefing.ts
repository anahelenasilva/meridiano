import { FeedProfile } from "./feed";

export interface BriefingOptions {
  feedProfile?: FeedProfile;
  lookbackHours?: number;
  minArticles?: number;
  customPrompts?: Partial<{
    clusterAnalysis: string;
    briefSynthesis: string;
  }>;
}

export interface BriefGenerationOptions {
  feedProfile: FeedProfile;
  lookbackHours?: number;
  minArticles?: number;
  nClusters?: number;
  customPrompts?: {
    clusterAnalysis?: string;
    briefSynthesis?: string;
  };
}

export interface SimpleBriefResult {
  success: boolean;
  briefingId?: number;
  content?: string;
  error?: string;
}

export interface RecentBriefingResult {
  id: number;
  content: string;
  articleCount: number;
  createdAt: Date;
}

export interface GetBriefingTrendsResult {
  totalBriefings: number;
  avgArticlesPerBrief: number;
  briefingsPerDay: Array<BriefingsPerDay>;
}

export interface BriefingsPerDay {
  date: string;
  count: number;
}

export interface GenerateBriefResult {
  success: boolean;
  briefingId?: number;
  content?: string;
  error?: string;
  stats?: {
    articlesAnalyzed: number;
    clustersGenerated: number;
    clustersUsed: number;
  };
}

export interface GetBriefByIdResult {
  id: number;
  brief_markdown: string;
  generated_at: Date;
  feed_profile: string;
}
