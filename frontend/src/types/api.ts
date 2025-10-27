const ArticleCategory = {
  NEWS: 'news',
  BLOG: 'blog',
  RESEARCH: 'research',
  NODEJS: 'nodejs',
  TYPESCRIPT: 'typescript',
  TUTORIAL: 'tutorial',
  OTHER: 'other',
} as const;

export type ArticleCategory = typeof ArticleCategory[keyof typeof ArticleCategory];

export interface Article {
  id: number;
  url: string;
  title: string;
  published_date: string;
  feed_source: string;
  feed_profile: string;
  content: string;
  processed_content: string;
  processed_content_html: string;
  content_html: string;
  impact_rating: number;
  image_url: string;
  created_at: string;
  categories: ArticleCategory[];
}

export interface Briefing {
  id: number;
  title: string;
  content: string;
  generated_at: string;
  feed_profile: string;
  summary: string;
}

export interface ArticlesResponse {
  articles: Article[];
  pagination: {
    page: number;
    per_page: number;
    total_pages: number;
    total_articles: number;
  };
  filters: {
    sort_by: string;
    direction: 'asc' | 'desc';
    feed_profile: string;
    search_term: string;
    start_date: string;
    end_date: string;
    preset: string;
  };
  available_profiles: string[];
}

export interface BriefingsResponse {
  briefings: Briefing[];
  current_feed_profile: string;
  available_profiles: string[];
}

export interface ArticleDetailResponse {
  article: Article;
  related_articles: Article[];
}

export interface BriefingDetailResponse {
  brief: {
    id: number;
    brief_markdown: string;
    generated_at: Date;
    feed_profile: string;
  };
}
