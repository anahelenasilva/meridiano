import { PromptVariables } from '../types/ai';
import { BriefingOptions } from '../types/briefing';
import { FeedProfile } from '../types/feed';
import { config, formatPrompt } from './config';

export class ConfigManager {
  private static instance: ConfigManager;
  private currentConfig = config;

  private constructor() { }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  public getPrompt(promptType: keyof typeof config.prompts, variables: PromptVariables): string {
    const template = this.currentConfig.prompts[promptType];
    return formatPrompt(template, variables);
  }

  public getArticleSummaryPrompt(articleContent: string): string {
    return this.getPrompt('articleSummary', { article_content: articleContent });
  }

  public getImpactRatingPrompt(summary: string): string {
    return this.getPrompt('impactRating', { summary });
  }

  public getClusterAnalysisPrompt(
    feedProfile: FeedProfile,
    clusterSummariesText: string,
    customPrompt?: string
  ): string {
    const template = customPrompt || this.currentConfig.prompts.clusterAnalysis;
    return formatPrompt(template, {
      feed_profile: feedProfile,
      cluster_summaries_text: clusterSummariesText,
    });
  }

  public getBriefSynthesisPrompt(
    feedProfile: FeedProfile,
    clusterAnalysesText: string,
    customPrompt?: string
  ): string {
    const template = customPrompt || this.currentConfig.prompts.briefSynthesis;
    return formatPrompt(template, {
      feed_profile: feedProfile,
      cluster_analyses_text: clusterAnalysesText,
    });
  }

  public getProcessingConfig(options?: Partial<typeof config.processing>) {
    return {
      ...this.currentConfig.processing,
      ...options,
    };
  }

  public getModelConfig() {
    return { ...this.currentConfig.models };
  }

  public getAppConfig() {
    return { ...this.currentConfig.app };
  }

  public getBriefingConfig(options?: BriefingOptions) {
    return {
      feedProfile: options?.feedProfile || this.currentConfig.app.defaultFeedProfile,
      lookbackHours: options?.lookbackHours || this.currentConfig.processing.briefingArticleLookbackHours,
      minArticles: options?.minArticles || this.currentConfig.processing.minArticlesForBriefing,
      customPrompts: options?.customPrompts,
      clustersQtd: this.currentConfig.processing.clustersQtd,
      articlesPerPage: this.currentConfig.processing.articlesPerPage,
    };
  }

  public validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (this.currentConfig.processing.briefingArticleLookbackHours <= 0) {
      errors.push('briefingArticleLookbackHours must be positive');
    }

    if (this.currentConfig.processing.minArticlesForBriefing <= 0) {
      errors.push('minArticlesForBriefing must be positive');
    }

    if (this.currentConfig.processing.clustersQtd <= 0) {
      errors.push('clustersQtd must be positive');
    }

    if (this.currentConfig.processing.articlesPerPage <= 0) {
      errors.push('articlesPerPage must be positive');
    }

    if (!this.currentConfig.models.deepseekChatModel.trim()) {
      errors.push('deepseekChatModel cannot be empty');
    }

    if (!this.currentConfig.models.embeddingModel.trim()) {
      errors.push('embeddingModel cannot be empty');
    }

    if (this.currentConfig.app.maxArticlesForScrapping <= 0) {
      errors.push('maxArticlesForScrapping must be positive');
    }

    Object.entries(this.currentConfig.prompts).forEach(([key, prompt]) => {
      if (!prompt.trim()) {
        errors.push(`Prompt '${key}' cannot be empty`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  public updateConfig(updates: Partial<typeof config>): void {
    this.currentConfig = {
      ...this.currentConfig,
      ...updates,
      prompts: { ...this.currentConfig.prompts, ...updates.prompts },
      processing: { ...this.currentConfig.processing, ...updates.processing },
      models: { ...this.currentConfig.models, ...updates.models },
      app: { ...this.currentConfig.app, ...updates.app },
    };
  }

  public resetConfig(): void {
    this.currentConfig = { ...config };
  }

  public getEnvironmentConfig(): Partial<typeof config> {
    const env = process.env.NODE_ENV || 'development';

    switch (env) {
      case 'production':
        return {
          processing: {
            ...this.currentConfig.processing,
            // Maybe use more clusters in production
            clustersQtd: 15,
          },
        };
      case 'test':
        return {
          processing: {
            ...this.currentConfig.processing,
            // Smaller values for faster tests
            minArticlesForBriefing: 2,
            clustersQtd: 3,
          },
          app: {
            ...this.currentConfig.app,
            databaseFile: ':memory:', // Use in-memory database for tests
            maxArticlesForScrapping: 10,
          },
        };
      default:
        return {};
    }
  }
}

export const configManager = ConfigManager.getInstance();
