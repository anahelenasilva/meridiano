// Example usage of the TypeScript configuration system
// This demonstrates how to use the converted configuration

import { ArticleSummary, ImpactRating, NewsCluster } from '../types/ai';
import { config, formatPrompt, isValidImpactRating } from './config';
import { configManager } from './configManager';

// Example 1: Basic configuration usage
export function getBasicSettings() {
  console.log('Database file:', config.app.databaseFile);
  console.log('Default feed profile:', config.app.defaultFeedProfile);
  console.log('Articles per page:', config.processing.articlesPerPage);
  console.log('Chat model:', config.models.deepseekChatModel);
}

// Example 2: Using prompts with variable substitution
export function generateArticleSummaryPrompt(articleContent: string): string {
  return formatPrompt(config.prompts.articleSummary, {
    article_content: articleContent,
  });
}

// Example 3: Using the configuration manager
export function generateImpactRatingPrompt(summary: string): string {
  return configManager.getImpactRatingPrompt(summary);
}

// Example 4: Processing articles with type safety
export function processArticle(content: string, title: string): ArticleSummary {
  // Generate summary prompt
  const summaryPrompt = configManager.getArticleSummaryPrompt(content);

  // In a real implementation, you would call your AI service here
  const summary = `AI-generated summary of: ${title}`;

  // Generate impact rating prompt
  const ratingPrompt = configManager.getImpactRatingPrompt(summary);

  // In a real implementation, you would call your AI service here
  const rawRating = 5; // Mock rating

  // Validate the rating
  if (!isValidImpactRating(rawRating)) {
    throw new Error(`Invalid impact rating: ${rawRating}`);
  }

  return {
    id: crypto.randomUUID(),
    title,
    content,
    summary,
    impactRating: rawRating as ImpactRating,
    timestamp: new Date(),
    feedProfile: config.app.defaultFeedProfile,
  };
}

// Example 5: Creating news clusters
export function createNewsCluster(articles: ArticleSummary[]): NewsCluster {
  const clusterSummariesText = articles
    .map(article => `${article.title}: ${article.summary}`)
    .join('\n\n');

  const analysisPrompt = configManager.getClusterAnalysisPrompt(
    'technology', // feed profile
    clusterSummariesText
  );

  // In a real implementation, you would call your AI service here
  const analysis = `Analysis of ${articles.length} articles about technology`;

  return {
    id: crypto.randomUUID(),
    articles,
    analysis,
    significance: Math.max(...articles.map(a => a.impactRating)),
    topics: ['technology', 'innovation'], // Mock topics
  };
}

// Example 6: Environment-specific configuration
export function setupEnvironmentConfig() {
  // Apply environment-specific overrides
  const envConfig = configManager.getEnvironmentConfig();
  configManager.updateConfig(envConfig);

  // Validate the configuration
  const validation = configManager.validateConfig();
  if (!validation.valid) {
    throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`);
  }

  console.log('Configuration validated successfully');
}

// Example 7: Custom briefing options
export function generateCustomBrief() {
  const briefingConfig = configManager.getBriefingConfig({
    feedProfile: 'technology',
    lookbackHours: 48, // Look back 48 hours instead of default 24
    minArticles: 3,    // Require fewer articles
    customPrompts: {
      briefSynthesis: `
You are creating a technology briefing. Focus on:
- Major product releases
- Regulatory changes
- Market movements
- Security incidents

{cluster_analyses_text}
`,
    },
  });

  console.log('Custom briefing configuration:', briefingConfig);
  return briefingConfig;
}

// Example 8: Type-safe configuration updates
export function updateConfigSafely() {
  // This will be type-checked at compile time
  configManager.updateConfig({
    processing: {
      ...config.processing, // Spread existing config to satisfy required properties
      briefingArticleLookbackHours: 48,
      nClusters: 12,
      // TypeScript will catch if we try to set invalid properties
    },
    models: {
      deepseekChatModel: 'deepseek-chat-v2',
      // embeddingModel is required, so TypeScript ensures we don't miss it
      embeddingModel: config.models.embeddingModel,
    },
  });
}

// Export example functions for demonstration
export const examples = {
  getBasicSettings,
  generateArticleSummaryPrompt,
  generateImpactRatingPrompt,
  processArticle,
  createNewsCluster,
  setupEnvironmentConfig,
  generateCustomBrief,
  updateConfigSafely,
};
