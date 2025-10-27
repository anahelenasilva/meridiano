
export type ImpactRating = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface PromptVariables {
  article_content?: string;
  summary?: string;
  title?: string;
  content?: string;
  feed_profile?: string;
  cluster_summaries_text?: string;
  cluster_analyses_text?: string;
}

export interface EmbeddingResponse {
  data: Array<{
    embedding: number[];
  }>;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ProcessingStats {
  feedProfile: string;
  articlesProcessed: number;
  articlesRated: number;
  articlesCategorized: number;
  errors: number;
  startTime: Date;
  endTime?: Date;
}
