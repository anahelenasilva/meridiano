import { initializeClients, testApiConnectivity } from './apiClients';
import { generateBrief, generateSimpleBrief } from './briefing';
import * as database from './database';
import { getArticlesForBriefing, getUnprocessedArticles } from './database/articles';
import { getDatabaseStats } from './database/stats';
import { feedManager } from './feeds/feedManager';
import { processArticles, rateArticles } from './processor';
import { scrapeArticles } from './scraper';

/**
 * Example 1: Complete briefing workflow
 */
export async function completeWorkflowExample(): Promise<void> {
  console.log('=== Complete Briefing Workflow Example ===');

  // 1. Initialize the system
  await database.initDb();
  initializeClients();

  // 2. Test API connectivity
  const apiTest = await testApiConnectivity();
  console.log('API Status:', apiTest);

  // 3. Get available feeds
  const techFeeds = feedManager.getEnabledFeedsForProfile('technology');
  console.log(`Found ${techFeeds.length} tech feeds`);

  // 4. Scrape articles
  const scrapingStats = await scrapeArticles('technology');
  console.log('Scraping results:', scrapingStats);

  // 5. Process articles
  const processingStats = await processArticles('technology');
  console.log('Processing results:', processingStats);

  // 6. Rate articles
  const ratingStats = await rateArticles('technology');
  console.log('Rating results:', ratingStats);

  // 7. Generate brief
  const briefResult = await generateBrief('technology');
  console.log('Brief generation result:', briefResult);

  await database.closeDb();
}

/**
 * Example 2: Working with feed configurations
 */
export async function feedConfigurationExample(): Promise<void> {
  console.log('=== Feed Configuration Example ===');

  // Get all available profiles
  const profiles = feedManager.getAvailableProfiles();
  console.log('Available profiles:', profiles);

  // Get configuration summary
  const configSummary = feedManager.getConfigSummary();
  console.log('Configuration summary:', configSummary);

  // Work with specific profile
  const techFeeds = feedManager.getFeedsForProfile('technology');
  console.log(`Technology feeds: ${techFeeds.length}`);

  // Search for specific feeds
  const securityFeeds = feedManager.searchFeeds('security');
  console.log('Security-related feeds:', securityFeeds.map(f => f.name));

  // Get feeds by category
  const cybersecurityFeeds = feedManager.getFeedsByCategory('cybersecurity');
  console.log('Cybersecurity feeds:', cybersecurityFeeds.map(f => f.name));

  // Validate feed configurations
  const validation = feedManager.validateConfigurations();
  console.log('Configuration validation:', validation);
}

/**
 * Example 3: Database operations
 */
export async function databaseOperationsExample(): Promise<void> {
  console.log('=== Database Operations Example ===');

  await database.initDb();

  const stats = await getDatabaseStats();
  console.log('Database statistics:', stats);

  const unprocessed = await getUnprocessedArticles('technology', 10);
  console.log(`Unprocessed articles: ${unprocessed.length}`);

  const briefingArticles = await getArticlesForBriefing(24, 'technology');
  console.log(`Articles for briefing: ${briefingArticles.length}`);

  await database.closeDb();
}

/**
 * Example 4: Custom briefing generation
 */
export async function customBriefingExample(): Promise<void> {
  console.log('=== Custom Briefing Example ===');

  await database.initDb();
  initializeClients();

  // Generate brief with custom options
  const customBriefResult = await generateBrief('technology', {
    feedProfile: 'technology',
    lookbackHours: 48, // Look back 48 hours instead of 24
    minArticles: 3,    // Require fewer articles
    nClusters: 8,      // Use 8 clusters instead of default
    customPrompts: {
      briefSynthesis: `
You are creating a technology briefing for a YouTube channel. Focus on:
- Major product releases and announcements
- Regulatory changes affecting tech companies
- Market movements and acquisitions
- Security incidents and vulnerabilities
- Innovation breakthroughs

Format as an engaging briefing suitable for video content.

{cluster_analyses_text}
`,
    },
  });

  if (customBriefResult.success) {
    console.log('Custom brief generated successfully!');
    console.log('Brief content preview:', customBriefResult.content?.substring(0, 500));
  } else {
    console.error('Custom brief generation failed:', customBriefResult.error);
  }

  await database.closeDb();
}

/**
 * Example 5: Simple brief for small datasets
 */
export async function simpleBriefExample(): Promise<void> {
  console.log('=== Simple Brief Example ===');

  await database.initDb();
  initializeClients();

  // Generate simple brief without clustering
  const simpleBriefResult = await generateSimpleBrief('technology', 5);

  if (simpleBriefResult.success) {
    console.log('Simple brief generated successfully!');
    console.log('Brief ID:', simpleBriefResult.briefingId);
  } else {
    console.error('Simple brief generation failed:', simpleBriefResult.error);
  }

  await database.closeDb();
}

/**
 * Example 6: Error handling and monitoring
 */
export async function errorHandlingExample(): Promise<void> {
  console.log('=== Error Handling Example ===');

  try {
    await database.initDb();

    // Test API connectivity with error handling
    const apiTest = await testApiConnectivity();

    if (!apiTest.deepseek || !apiTest.embedding) {
      console.warn('Some APIs are unavailable:');
      apiTest.errors.forEach(error => console.warn(`- ${error}`));

      // Decide whether to continue or abort
      if (!apiTest.deepseek && !apiTest.embedding) {
        throw new Error('Critical APIs unavailable');
      }
    }

    // Example of handling partial failures
    const processingStats = await processArticles('technology', 10);

    if (processingStats.errors > 0) {
      console.warn(`Processing completed with ${processingStats.errors} errors`);
      console.log(`Successfully processed: ${processingStats.articlesProcessed} articles`);
    }

  } catch (error) {
    console.error('Example failed:', error);
  } finally {
    await database.closeDb();
  }
}

/**
 * Example 7: Performance monitoring
 */
export async function performanceMonitoringExample(): Promise<void> {
  console.log('=== Performance Monitoring Example ===');

  const startTime = Date.now();

  await database.initDb();
  initializeClients();

  // Monitor each stage
  console.time('Scraping');
  const scrapingStats = await scrapeArticles('technology');
  console.timeEnd('Scraping');

  console.time('Processing');
  const processingStats = await processArticles('technology');
  console.timeEnd('Processing');

  console.time('Rating');
  const ratingStats = await rateArticles('technology');
  console.timeEnd('Rating');

  console.time('Brief Generation');
  const briefResult = await generateBrief('technology');
  console.timeEnd('Brief Generation');

  const totalTime = Date.now() - startTime;

  console.log('\n=== Performance Summary ===');
  console.log(`Total execution time: ${totalTime}ms`);
  console.log(`Articles scraped: ${scrapingStats.newArticles}`);
  console.log(`Articles processed: ${processingStats.articlesProcessed}`);
  console.log(`Articles rated: ${ratingStats.articlesRated}`);
  console.log(`Brief generated: ${briefResult.success ? 'Yes' : 'No'}`);

  if (briefResult.success && briefResult.stats) {
    console.log(`Clusters analyzed: ${briefResult.stats.clustersUsed}`);
  }

  await database.closeDb();
}

// Export all examples
export const examples = {
  completeWorkflowExample,
  feedConfigurationExample,
  databaseOperationsExample,
  customBriefingExample,
  simpleBriefExample,
  errorHandlingExample,
  performanceMonitoringExample,
};

// Usage instructions
export const usageInstructions = `
=== Meridian Briefing System Usage ===

Command Line Usage:
  npm run briefing                          # Run all stages for default profile
  npm run briefing -- --feed technology    # Run all stages for technology profile
  npm run briefing -- --scrape            # Run only scraping
  npm run briefing -- --process           # Run only processing
  npm run briefing -- --rate              # Run only rating
  npm run briefing -- --generate          # Run only brief generation
  npm run briefing -- --status            # Show system status
  npm run briefing -- --list-profiles     # List available profiles
  npm run briefing -- --simple-brief      # Generate simple brief

Programmatic Usage:
  import { examples } from './briefingExamples';

  // Run complete workflow
  await examples.completeWorkflowExample();

  // Generate custom brief
  await examples.customBriefingExample();

  // Monitor performance
  await examples.performanceMonitoringExample();

Environment Variables Required:
  DEEPSEEK_API_KEY    # API key for Deepseek LLM
  EMBEDDING_API_KEY   # API key for Together AI embeddings

Configuration:
  Edit src/configs/config.ts for global settings
  Edit src/feeds/tech.ts for technology feed configuration
  Add new feed profiles in src/feeds/ directory
`;

export default examples;
