// Examples of using the TypeScript tech feed configuration
// Demonstrates various ways to interact with feed configurations

import { formatPrompt } from '../configs/config';
import { feedManager } from './feedManager';
import {
    getEnabledFeeds,
    getFeedsByCategory,
    getTechFeedStats,
    RSS_FEEDS,
    techFeedConfig,
    techPrompts
} from './tech';

// Example 1: Basic feed configuration usage
export function getTechFeedInfo() {
    console.log('Tech Feed Profile:', techFeedConfig.profile);
    console.log('Total feeds:', techFeedConfig.rssFeeds.length);
    console.log('Feed settings:', techFeedConfig.settings);

    const stats = getTechFeedStats();
    console.log('Feed statistics:', stats);
}

// Example 2: Working with feed categories
export function exploreCategories() {
    const cybersecurityFeeds = getFeedsByCategory('cybersecurity');
    console.log('Cybersecurity feeds:', cybersecurityFeeds.map(f => f.name));

    const startupFeeds = getFeedsByCategory('startup');
    console.log('Startup feeds:', startupFeeds.map(f => f.name));

    const chinaFeeds = getFeedsByCategory('china-tech');
    console.log('China tech feeds:', chinaFeeds.map(f => f.name));
}

// Example 3: Using the feed manager
export function manageFeedsExample() {
    // Get tech feeds through the manager
    const techFeeds = feedManager.getFeedsForProfile('technology');
    console.log('Tech feeds count:', techFeeds.length);

    // Get enabled feeds only
    const enabledFeeds = feedManager.getEnabledFeedsForProfile('technology');
    console.log('Enabled tech feeds:', enabledFeeds.length);

    // Search for specific feeds
    const securityFeeds = feedManager.searchFeeds('security');
    console.log('Security-related feeds:', securityFeeds.map(f => f.name));

    // Get global statistics
    const globalStats = feedManager.getGlobalFeedStats();
    console.log('Global feed stats:', globalStats);
}

// Example 4: Using custom prompts
export function useCustomPrompts() {
    const articleContent = `
    Apple announced new MacBook Pro models with M3 chips, featuring improved performance
    and battery life. The laptops will be available starting next month with prices
    starting at $1,999.
  `;

    // Generate article summary prompt
    const summaryPrompt = formatPrompt(techPrompts.articleSummary, {
        article_content: articleContent,
    });
    console.log('Summary prompt generated');

    // Example summary for impact rating
    const summary = "Apple releases new MacBook Pro with M3 chips, improving performance and battery life";

    // Generate impact rating prompt
    const ratingPrompt = formatPrompt(techPrompts.impactRating, {
        summary: summary,
    });
    console.log('Rating prompt generated');

    return { summaryPrompt, ratingPrompt };
}

// Example 5: Feed validation and management
export function validateAndManageFeeds() {
    // Validate all feed configurations
    const validation = feedManager.validateConfigurations();

    if (!validation.valid) {
        console.error('Feed validation errors:', validation.errors);
        return false;
    }

    console.log('All feeds validated successfully');

    // Get configuration summary
    const summary = feedManager.getConfigSummary();
    console.log('Feed configuration summary:', summary);

    return true;
}

// Example 6: Backward compatibility
export function backwardCompatibilityExample() {
    // The RSS_FEEDS export provides backward compatibility
    // with the original Python list format
    console.log('RSS feed URLs (backward compatible):');
    RSS_FEEDS.forEach((url, index) => {
        console.log(`${index + 1}. ${url}`);
    });

    // But you can also get much richer information
    const enabledFeeds = getEnabledFeeds();
    console.log('\nDetailed feed information:');
    enabledFeeds.forEach(feed => {
        console.log(`- ${feed.name} (${feed.category}): ${feed.description}`);
    });
}

// Example 7: Dynamic feed management
export function dynamicFeedManagement() {
    // Temporarily disable a feed
    const bleepingComputerUrl = "https://www.bleepingcomputer.com/feed/";
    const success = feedManager.toggleFeed(bleepingComputerUrl, false);

    if (success) {
        console.log('Temporarily disabled BleepingComputer feed');

        // Check the change
        const enabledCount = feedManager.getEnabledFeedsForProfile('technology').length;
        console.log('Enabled feeds after disabling one:', enabledCount);

        // Re-enable it
        feedManager.toggleFeed(bleepingComputerUrl, true);
        console.log('Re-enabled BleepingComputer feed');
    }
}

// Example 8: Creating briefing content
export function generateBriefingExample() {
    const clusterAnalysesText = `
Cluster 1: Apple M3 MacBook Pro Release
- Apple announces new MacBook Pro models with M3 chips
- Improved performance and battery life
- Starting at $1,999

Cluster 2: Cybersecurity Incidents
- Major data breach at tech company
- New malware targeting macOS users
- Security updates released

Cluster 3: China Tech Regulations
- New AI regulations announced
- Impact on tech companies
- Market response
  `;

    const briefingPrompt = formatPrompt(techPrompts.briefSynthesis, {
        cluster_analyses_text: clusterAnalysesText,
    });

    console.log('Briefing prompt generated for tech YouTube channel');
    return briefingPrompt;
}

// Export all examples
export const techFeedExamples = {
    getTechFeedInfo,
    exploreCategories,
    manageFeedsExample,
    useCustomPrompts,
    validateAndManageFeeds,
    backwardCompatibilityExample,
    dynamicFeedManagement,
    generateBriefingExample,
};
