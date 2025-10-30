import { FeedConfiguration, FeedProfile, RSSFeed } from '../types/feed';
import { brasilFeedConfig } from './brasil';
import { techFeedConfig } from './tech';
import { teclasFeedConfig } from './teclas';

export class FeedManager {
  private static instance: FeedManager;
  private feedConfigurations: Map<FeedProfile, FeedConfiguration> = new Map();

  private constructor() {
    this.registerFeedConfig(techFeedConfig);
    this.registerFeedConfig(brasilFeedConfig);
    this.registerFeedConfig(teclasFeedConfig);
  }

  public static getInstance(): FeedManager {
    if (!FeedManager.instance) {
      FeedManager.instance = new FeedManager();
    }

    return FeedManager.instance;
  }

  public registerFeedConfig(config: FeedConfiguration): void {
    this.feedConfigurations.set(config.profile, config);
  }

  public getFeedConfig(profile: FeedProfile): FeedConfiguration | undefined {
    return this.feedConfigurations.get(profile);
  }

  public getAvailableProfiles(): FeedProfile[] {
    return Array.from(this.feedConfigurations.keys());
  }

  public getFeedsForProfile(profile: FeedProfile): RSSFeed[] {
    const config = this.getFeedConfig(profile);
    return config?.rssFeeds || [];
  }

  public getEnabledFeedsForProfile(profile: FeedProfile): RSSFeed[] {
    const feeds = this.getFeedsForProfile(profile);
    return feeds.filter(feed => feed.enabled !== false);
  }

  public getAllFeeds(): RSSFeed[] {
    const allFeeds: RSSFeed[] = [];
    for (const config of this.feedConfigurations.values()) {
      allFeeds.push(...config.rssFeeds);
    }

    return allFeeds;
  }

  public getAllEnabledFeeds(): RSSFeed[] {
    return this.getAllFeeds().filter(feed => feed.enabled !== false);
  }

  public getPromptsForProfile(profile: FeedProfile) {
    const config = this.getFeedConfig(profile);
    return config?.prompts || {};
  }

  public getFeedsByCategory(category: string): RSSFeed[] {
    const allFeeds = this.getAllFeeds();
    return allFeeds.filter(feed => feed.category === category);
  }

  public searchFeeds(query: string): RSSFeed[] {
    const allFeeds = this.getAllFeeds();
    const lowercaseQuery = query.toLowerCase();

    return allFeeds.filter(feed =>
      feed.name.toLowerCase().includes(lowercaseQuery) ||
      (feed.description && feed.description.toLowerCase().includes(lowercaseQuery)) ||
      (feed.category && feed.category.toLowerCase().includes(lowercaseQuery))
    );
  }

  public toggleFeed(url: string, enabled: boolean): boolean {
    for (const config of this.feedConfigurations.values()) {
      const feed = config.rssFeeds.find(f => f.url === url);

      if (feed) {
        feed.enabled = enabled;
        return true;
      }
    }

    return false;
  }

  public getGlobalFeedStats() {
    const allFeeds = this.getAllFeeds();
    const enabledFeeds = this.getAllEnabledFeeds();
    const profiles = this.getAvailableProfiles();

    const categoryCounts = new Map<string, number>();
    const profileCounts = new Map<FeedProfile, number>();

    allFeeds.forEach(feed => {
      if (feed.category) {
        categoryCounts.set(feed.category, (categoryCounts.get(feed.category) || 0) + 1);
      }
    });

    this.feedConfigurations.forEach((config, profile) => {
      profileCounts.set(profile, config.rssFeeds.length);
    });

    return {
      totalFeeds: allFeeds.length,
      enabledFeeds: enabledFeeds.length,
      disabledFeeds: allFeeds.length - enabledFeeds.length,
      profiles: profiles.length,
      categories: categoryCounts.size,
      categoryBreakdown: Object.fromEntries(categoryCounts),
      profileBreakdown: Object.fromEntries(profileCounts),
    };
  }

  public getConfigSummary() {
    const configs = Array.from(this.feedConfigurations.entries()).map(([profile, config]) => {
      const feeds = config.rssFeeds;
      const enabledFeeds = feeds.filter(f => f.enabled !== false);
      const categories = new Set(feeds.map(f => f.category).filter(Boolean));

      return {
        profile,
        totalFeeds: feeds.length,
        enabledFeeds: enabledFeeds.length,
        categories: Array.from(categories),
        priority: config.settings?.priority || 0,
        enabled: config.settings?.enabled !== false,
        hasCustomPrompts: Object.keys(config.prompts || {}).length > 0,
      };
    });

    return configs.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }

  public validateConfigurations(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const seenUrls = new Set<string>();

    for (const [profile, config] of this.feedConfigurations.entries()) {
      config.rssFeeds.forEach(feed => {
        if (seenUrls.has(feed.url)) {
          errors.push(`Duplicate feed URL found: ${feed.url} in profile ${profile}`);
        } else {
          seenUrls.add(feed.url);
        }

        try {
          new URL(feed.url);
        } catch {
          errors.push(`Invalid URL format: ${feed.url} in profile ${profile}`);
        }

        if (!feed.name.trim()) {
          errors.push(`Feed missing name: ${feed.url} in profile ${profile}`);
        }
      });

      if (!profile.trim()) {
        errors.push('Feed configuration has empty profile name');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export const feedManager = FeedManager.getInstance();
