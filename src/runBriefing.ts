import { Command } from 'commander';
import console from 'console';
import dotenv from 'dotenv';

import { initializeClients, testApiConnectivity } from './apiClients';
import { generateBrief, generateSimpleBrief } from './briefing';
import config from './configs/config';
import * as database from './database';
import { getDatabaseStats } from './database/stats';
import { feedManager } from './feeds/feedManager';
import { processArticles, rateArticles } from './processor';
import { scrapeArticles } from './scraper';
import { FeedProfile } from './types/feed';

dotenv.config();

const program = new Command();

async function initialize(): Promise<void> {
  console.log('Initializing Meridian Briefing System...');

  console.log('Initializing database...');
  await database.initDb();

  console.log('Initializing API clients...');
  initializeClients();

  console.log('Testing API connectivity...');
  const apiTest = await testApiConnectivity();

  if (!apiTest.deepseek || !apiTest.embedding) {
    console.error('API connectivity issues detected:');
    apiTest.errors.forEach(error => console.error(`  - ${error}`));

    if (!apiTest.deepseek && !apiTest.embedding) {
      console.error('Both APIs are unavailable. Please check your configuration.');
      process.exit(1);
    } else {
      console.warn('Some APIs are unavailable. Functionality may be limited.');
    }
  } else {
    console.log('✓ All APIs are accessible');
  }

  console.log('Initialization complete.\n');
}

async function runAll(feedProfile: FeedProfile): Promise<void> {
  console.log(`\n>>> Running ALL stages for [${feedProfile}] <<<`);

  const startTime = new Date();

  try {
    const enabledFeeds = feedManager.getEnabledFeedsForProfile(feedProfile);
    if (enabledFeeds.length === 0) {
      console.log(`Warning: No enabled feeds found for profile '${feedProfile}'.`);
      return;
    }

    const feedUrls = enabledFeeds.map(f => f.url);

    // console.log("deleting articles");
    // await deleteArticles();
    // console.log("deleting articles finished");

    // 1. Scrape articles
    console.log('\n--- Stage 1: Scraping Articles ---');
    const scrapingStats = await scrapeArticles(feedProfile, feedUrls);
    console.log(`Scraping completed. New articles: ${scrapingStats.newArticles}, Errors: ${scrapingStats.errors}`);

    // 2. Process articles
    console.log('\n--- Stage 2: Processing Articles ---');
    const processingStats = await processArticles(feedProfile);
    console.log(`Processing completed. Processed: ${processingStats.articlesProcessed}, Errors: ${processingStats.errors}`);

    // 3. Rate articles
    console.log('\n--- Stage 3: Rating Articles ---');
    const ratingStats = await rateArticles(feedProfile);
    console.log(`Rating completed. Rated: ${ratingStats.articlesRated}, Errors: ${ratingStats.errors}`);

    // 4. Generate brief
    console.log('\n--- Stage 4: Generating Brief ---');
    const briefResult = await generateBrief(feedProfile);

    if (briefResult.success) {
      console.log(`Brief generated successfully. ID: ${briefResult.briefingId}`);
      if (briefResult.stats) {
        console.log(`Stats: ${briefResult.stats.articlesAnalyzed} articles, ${briefResult.stats.clustersUsed} clusters`);
      }
    } else {
      console.error(`Brief generation failed: ${briefResult.error}`);
    }

    const endTime = new Date();
    const duration = (endTime.getTime() - startTime.getTime()) / 1000;
    console.log(`\n✓ All stages completed in ${duration.toFixed(1)} seconds`);
  } catch (error) {
    console.error('Error during execution:', error);
    process.exit(1);
  }
}

async function runScraping(feedProfile: FeedProfile): Promise<void> {
  console.log(`\n>>> Running ONLY Scraping stage [${feedProfile}] <<<`);

  const enabledFeeds = feedManager.getEnabledFeedsForProfile(feedProfile);

  if (enabledFeeds.length === 0) {
    console.log(`Cannot run scrape stage: No enabled feeds found for profile '${feedProfile}'.`);
    return;
  }

  const feedUrls = enabledFeeds.map(f => f.url);
  const stats = await scrapeArticles(feedProfile, feedUrls);

  console.log(`Scraping completed. New articles: ${stats.newArticles}, Errors: ${stats.errors}`);
}

async function runProcessing(feedProfile: FeedProfile): Promise<void> {
  console.log(`\n>>> Running ONLY Processing stage [${feedProfile}] <<<`);

  const stats = await processArticles(feedProfile);
  console.log(`Processing completed. Processed: ${stats.articlesProcessed}, Errors: ${stats.errors}`);
}

async function runRating(feedProfile: FeedProfile): Promise<void> {
  console.log(`\n>>> Running ONLY Rating stage [${feedProfile}] <<<`);

  const stats = await rateArticles(feedProfile);
  console.log(`Rating completed. Rated: ${stats.articlesRated}, Errors: ${stats.errors}`);
}

async function runBriefGeneration(feedProfile: FeedProfile): Promise<void> {
  console.log(`\n>>> Running ONLY Brief Generation stage [${feedProfile}] <<<`);

  const enabledFeeds = feedManager.getEnabledFeedsForProfile(feedProfile);

  if (enabledFeeds.length === 0) {
    console.log(`Cannot run generate stage: No enabled feeds found for profile '${feedProfile}'.`);
    return;
  }

  const result = await generateBrief(feedProfile);

  if (result.success) {
    console.log(`Brief generated successfully. ID: ${result.briefingId}`);
    if (result.stats) {
      console.log(`Stats: ${result.stats.articlesAnalyzed} articles, ${result.stats.clustersUsed} clusters`);
    }
  } else {
    console.error(`Brief generation failed: ${result.error}`);
  }
}

async function showStatus(): Promise<void> {
  console.log('\n--- Meridian System Status ---');

  try {
    const dbStats = await getDatabaseStats();
    console.log('\nDatabase Statistics:');
    console.log(`  Total articles: ${dbStats.totalArticles}`);
    console.log(`  Processed articles: ${dbStats.processedArticles}`);
    console.log(`  Rated articles: ${dbStats.ratedArticles}`);
    console.log(`  Total briefings: ${dbStats.totalBriefings}`);
  } catch (error) {
    console.error('Error getting database stats:', error);
  }

  const feedStats = feedManager.getGlobalFeedStats();
  console.log('\nFeed Statistics:');
  console.log(`  Total feeds: ${feedStats.totalFeeds}`);
  console.log(`  Enabled feeds: ${feedStats.enabledFeeds}`);
  console.log(`  Profiles: ${feedStats.profiles}`);

  const apiTest = await testApiConnectivity();
  console.log('\nAPI Status:');
  console.log(`  Deepseek API: ${apiTest.deepseek ? '✓ Available' : '✗ Unavailable'}`);
  console.log(`  Embedding API: ${apiTest.embedding ? '✓ Available' : '✗ Unavailable'}`);

  if (apiTest.errors.length > 0) {
    console.log('\nAPI Errors:');
    apiTest.errors.forEach(error => console.log(`  - ${error}`));
  }
}

function listProfiles(): void {
  console.log('\n--- Available Feed Profiles ---');

  const profiles = feedManager.getAvailableProfiles();
  const configSummary = feedManager.getConfigSummary();

  configSummary.forEach(config => {
    const status = config.enabled ? '✓' : '✗';
    console.log(`  ${status} ${config.profile} (${config.enabledFeeds}/${config.totalFeeds} feeds enabled)`);

    if (config.categories.length > 0) {
      console.log(`    Categories: ${config.categories.join(', ')}`);
    }
  });

  console.log(`\nDefault profile: ${config.app.defaultFeedProfile}`);
}

// Configure CLI commands
program
  .name('meridian-briefing')
  .description('Meridian Briefing System - AI-powered news analysis and briefing generation')
  .version('1.0.0');

program
  .option('-f, --feed <profile>', `Specify the feed profile name (default: ${config.app.defaultFeedProfile})`, config.app.defaultFeedProfile)
  .option('--scrape', 'Run only the article scraping stage')
  .option('--process', 'Run only the article processing (summarize, embed) stage')
  .option('--rate', 'Run only the article impact rating stage')
  .option('--generate', 'Run only the brief generation stage')
  .option('--all', 'Run all stages sequentially (default behavior)')
  .option('--status', 'Show system status')
  .option('--list-profiles', 'List available feed profiles')
  .option('--simple-brief', 'Generate a simple brief without clustering');

program.parse();

const options = program.opts();

async function main(): Promise<void> {
  try {
    // Handle special commands first
    if (options.status) {
      await initialize();
      await showStatus();
      return;
    }

    if (options.listProfiles) {
      listProfiles();
      return;
    }

    await initialize();

    const feedProfile = options.feed as FeedProfile;

    const availableProfiles = feedManager.getAvailableProfiles();
    if (!availableProfiles.includes(feedProfile)) {
      console.error(`Error: Feed profile '${feedProfile}' not found.`);
      console.log('Available profiles:', availableProfiles.join(', '));
      process.exit(1);
    }

    console.log(`\nMeridian Briefing Run [${feedProfile}] - ${new Date().toISOString()}`);

    const hasSpecificStage = options.scrape || options.process || options.rate || options.generate;
    const shouldRunAll = options.all || !hasSpecificStage;

    if (options.simpleBrief) {
      console.log('\n>>> Generating Simple Brief <<<');
      const result = await generateSimpleBrief(feedProfile);
      if (result.success) {
        console.log(`Simple brief generated successfully. ID: ${result.briefingId}`);
      } else {
        console.error(`Simple brief generation failed: ${result.error}`);
      }
    } else if (shouldRunAll) {
      await runAll(feedProfile);
    } else {
      // Run specific stages
      if (options.scrape) {
        await runScraping(feedProfile);
      }

      if (options.process) {
        await runProcessing(feedProfile);
      }

      if (options.rate) {
        await runRating(feedProfile);
      }

      if (options.generate) {
        await runBriefGeneration(feedProfile);
      }
    }

    console.log(`\nRun Finished [${feedProfile}] - ${new Date().toISOString()}`);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await database.closeDb();
  }
}

main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
