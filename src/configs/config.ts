import { ImpactRating, PromptVariables } from '../types/ai';
import { FeedProfile } from '../types/feed';

export interface Config {
  // Prompt templates
  prompts: {
    articleSummary: string;
    impactRating: string;
    categoryClassification: string;
    clusterAnalysis: string;
    briefSynthesis: string;
  };

  // Processing settings
  processing: {
    briefingArticleLookbackHours: number;
    minArticlesForBriefing: number;
    articlesPerPage: number;
    clustersQtd: number;
  };

  // Model settings
  models: {
    deepseekChatModel: string;
    embeddingModel: string;
  };

  // Application settings
  app: {
    defaultFeedProfile: FeedProfile;
    databaseFile: string;
    maxArticlesForScrapping: number;
  };
}

export const config: Config = {
  prompts: {
    // Used in process_articles (operates globally, so uses default)
    articleSummary: `
Summarize the key points of this news article objectively in 2-4 sentences.
Identify the main topics covered.

Article:
{article_content}
`,

    // Used in rate_articles (operates globally, so uses default)
    impactRating: `
Analyze the following news summary and estimate its overall impact. Consider factors like geographic scope (local vs global), number of people affected, severity, and potential long-term consequences.

Rate the impact on a scale of 1 to 10, where:
1-2: Minor, niche, or local interest.
3-4: Notable event for a specific region or community.
5-6: Significant event with broader regional or moderate international implications.
7-8: Major event with significant international importance or wide-reaching effects.
9-10: Critical global event with severe, widespread, or potentially historic implications.

Summary:
"{summary}"

Output ONLY the integer number representing your rating (1-10).
`,

    // Used in categorize_articles (operates globally, so uses default)
    categoryClassification: `
Analyze the following article title and content to classify it into appropriate categories.

Available categories:
- news: General news articles
- blog: Blog posts or opinion pieces
- research: Research papers or technical studies
- nodejs: Node.js related content
- typescript: TypeScript related content
- tutorial: Tutorials or how-to guides
- other: Content that doesn't fit other categories

Article Title: "{title}"
Article Content: "{content}"

Analyze the content and return ONLY a JSON array of relevant categories. For example:
["news", "nodejs"] or ["tutorial", "typescript"] or ["research"]

Choose 1-3 most relevant categories. Return only the JSON array, no other text.
`,

    // Used in generate_brief (can be overridden per profile)
    clusterAnalysis: `
These are summaries of potentially related news articles from a '{feed_profile}' context:

{cluster_summaries_text}

What is the core event or topic discussed? Summarize the key developments and significance in 3-5 sentences based *only* on the provided text. If the articles seem unrelated, state that clearly.
`,

    // Used in generate_brief (can be overridden per profile)
    briefSynthesis: `
You are an AI assistant writing a Presidential-style daily intelligence briefing using Markdown, specifically for the '{feed_profile}' category.
Synthesize the following analyzed news clusters into a coherent, high-level executive summary.
Start with the 2-3 most critical overarching themes globally or within this category based *only* on these inputs.
Then, provide concise bullet points summarizing key developments within the most significant clusters (roughly 3-5 clusters).
Maintain an objective, analytical tone relevant to the '{feed_profile}' context. Avoid speculation.

Analyzed News Clusters (Most significant first):
{cluster_analyses_text}
`,
  },

  processing: {
    // How many hours back to look for articles when generating a brief
    briefingArticleLookbackHours: 24,

    // Minimum number of articles required to attempt clustering/briefing
    minArticlesForBriefing: 5,

    // Number of articles to display per page
    articlesPerPage: 15,

    // Approximate number of clusters to aim for. Fine-tune based on results.
    // Alternatively, use algorithms like DBSCAN that don't require specifying k.
    clustersQtd: 10,
  },

  models: {
    // Model for summarization and analysis (check Deepseek docs for latest models)
    deepseekChatModel: "deepseek-chat",

    // Model for embeddings
    embeddingModel: "togethercomputer/m2-bert-80M-32k-retrieval",
  },

  app: {
    defaultFeedProfile: "default",
    databaseFile: "meridian.db",

    // Maximum number of articles to fetch per feed for processing
    maxArticlesForScrapping: 50,
  },
};

// Export individual sections for convenience
export const prompts = config.prompts;
export const processing = config.processing;
export const models = config.models;
export const app = config.app;

// Export specific values that might be commonly used
export const {
  briefingArticleLookbackHours,
  minArticlesForBriefing,
  articlesPerPage,
  clustersQtd,
} = config.processing;

export const {
  deepseekChatModel,
  embeddingModel,
} = config.models;

export const {
  defaultFeedProfile,
  databaseFile,
} = config.app;

// Type guard functions for runtime validation
export const isValidImpactRating = (rating: number): rating is ImpactRating => {
  return Number.isInteger(rating) && rating >= 1 && rating <= 10;
};

// Utility function to format prompts with variables
export const formatPrompt = (template: string, variables: PromptVariables): string => {
  return Object.entries(variables).reduce(
    (prompt, [key, value]) => prompt.replace(new RegExp(`{${key}}`, 'g'), value),
    template
  );
};

export default config;
