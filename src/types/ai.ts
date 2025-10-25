import { FeedProfile } from "./feed";

export type ImpactRating = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface PromptVariables {
  article_content?: string;
  summary?: string;
  feed_profile?: string;
  cluster_summaries_text?: string;
  cluster_analyses_text?: string;
}

// Embedding Response Interface
export interface EmbeddingResponse {
  data: Array<{
    embedding: number[];
  }>;
}

// Chat Completion Response Interface
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ArticleSummary {
  id: string;
  title: string;
  content: string;
  summary: string;
  impactRating: ImpactRating;
  timestamp: Date;
  feedProfile: FeedProfile;
}

export interface NewsCluster {
  id: string;
  articles: ArticleSummary[];
  analysis: string;
  significance: number;
  topics: string[];
}

// Processing Statistics Interface
export interface ProcessingStats {
  feedProfile: string;
  articlesProcessed: number;
  articlesRated: number;
  errors: number;
  startTime: Date;
  endTime?: Date;
}
