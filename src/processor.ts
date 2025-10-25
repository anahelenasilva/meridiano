import { callDeepseekChat, getEmbedding } from './apiClients';
import { isValidImpactRating } from './configs/config';
import { configManager } from './configs/configManager';
import { getArticlesByFilter, getUnprocessedArticles, getUnratedArticles, updateArticleProcessing, updateArticleRating } from './database/articles';
import { getStats } from './database/briefing';
import { ProcessingStats } from './types/ai';
import { ProcessingStatsResult } from './types/briefing';
import { FeedProfile } from './types/feed';
import { DBArticle } from './types/scrapper';

export async function processArticles(
  feedProfile: FeedProfile,
  limit: number = 1000
): Promise<ProcessingStats> {
  console.log('\n--- Starting Article Processing ---');

  const stats: ProcessingStats = {
    feedProfile,
    articlesProcessed: 0,
    articlesRated: 0,
    errors: 0,
    startTime: new Date(),
  };

  const config = configManager.getBriefingConfig({ feedProfile });

  // console.log("deleting articles");
  // await deleteArticles();
  // console.log("deleting articles finished");

  const unprocessedArticles = await getUnprocessedArticles(feedProfile, limit);

  if (unprocessedArticles.length === 0) {
    console.log('No new articles to process.');
    stats.endTime = new Date();
    return stats;
  }

  console.log(`Found ${unprocessedArticles.length} articles to process.`);

  for (const article of unprocessedArticles) {
    console.log(`Processing article ID: ${article.id} - ${article.url.substring(0, 50)}...`);

    try {
      // 1. Generate summary using Deepseek Chat
      const summaryPrompt = configManager.getArticleSummaryPrompt(
        article.raw_content.substring(0, 4000) // Limit context
      );

      const summary = await callDeepseekChat(summaryPrompt);

      if (!summary) {
        console.log(`Skipping article ${article.id} due to summarization error.`);
        stats.errors++;
        continue;
      }

      const finalSummary = `${summary}\n\nSource: [${article.title}](${article.url})`;
      console.log(`Article summary generated: ${summary.substring(0, 100)}...`);

      // 2. Generate embedding using the summary
      const embedding = await getEmbedding(finalSummary);

      if (!embedding) {
        console.log(`Skipping article ${article.id} due to embedding error.`);
        stats.errors++;
        continue;
      }

      // 3. Update database
      await updateArticleProcessing(article.id, finalSummary, embedding);
      stats.articlesProcessed++;
      console.log(`Successfully processed article ID: ${article.id}`);

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Error processing article ${article.id}:`, error);
      stats.errors++;
    }
  }

  stats.endTime = new Date();
  console.log(`--- Processing Finished. Processed ${stats.articlesProcessed} articles. ---`);

  return stats;
}

export async function rateArticles(
  feedProfile: FeedProfile,
  limit: number = 1000
): Promise<ProcessingStats> {
  console.log('\n--- Starting Article Impact Rating ---');

  const stats: ProcessingStats = {
    feedProfile,
    articlesProcessed: 0,
    articlesRated: 0,
    errors: 0,
    startTime: new Date(),
  };

  const unratedArticles = await getUnratedArticles(feedProfile, limit);

  if (unratedArticles.length === 0) {
    console.log('No new articles to rate.');
    stats.endTime = new Date();
    return stats;
  }

  console.log(`Found ${unratedArticles.length} processed articles to rate.`);

  for (const article of unratedArticles) {
    console.log(`Rating article ID: ${article.id}: ${article.title}...`);

    if (!article.processed_content) {
      console.log(`  Skipping article ${article.id} - no summary found.`);
      continue;
    }

    try {
      const ratingPrompt = configManager.getImpactRatingPrompt(article.processed_content);
      const ratingResponse = await callDeepseekChat(ratingPrompt);

      if (ratingResponse) {
        try {
          const scoreMatch = ratingResponse.trim().match(/\d+/);
          if (scoreMatch) {
            const score = parseInt(scoreMatch[0], 10);

            if (isValidImpactRating(score)) {
              await updateArticleRating(article.id, score);
              stats.articlesRated++;
              console.log(`  Article ID ${article.id} rated as: ${score}`);
            } else {
              console.log(`  Warning: Rating ${score} for article ${article.id} is out of range (1-10).`);
              stats.errors++;
            }
          } else {
            console.log(`  Warning: Could not extract numeric rating from response '${ratingResponse}' for article ${article.id}.`);
            stats.errors++;
          }
        } catch (error) {
          console.log(`  Warning: Could not parse rating from response '${ratingResponse}' for article ${article.id}.`);
          stats.errors++;
        }
      } else {
        console.log(`  Warning: No rating response received for article ${article.id}.`);
        stats.errors++;
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Error rating article ${article.id}:`, error);
      stats.errors++;
    }
  }

  stats.endTime = new Date();
  console.log(`--- Rating Finished. Rated ${stats.articlesRated} articles. ---`);

  return stats;
}

export async function getProcessingStats(feedProfile: FeedProfile): Promise<ProcessingStatsResult> {
  return await getStats(feedProfile);
}

export async function reprocessArticles(
  feedProfile: FeedProfile,
  options: {
    regenerateSummaries?: boolean;
    regenerateRatings?: boolean;
    batchSize?: number;
  } = {}
): Promise<ProcessingStats> {
  const { regenerateSummaries = false, regenerateRatings = false, batchSize = 50 } = options;

  console.log('\n--- Starting Article Reprocessing ---');

  const stats: ProcessingStats = {
    feedProfile,
    articlesProcessed: 0,
    articlesRated: 0,
    errors: 0,
    startTime: new Date(),
  };

  let whereClause = 'feed_profile = ?';
  const params: any[] = [feedProfile];

  if (regenerateSummaries && regenerateRatings) {
    // Reprocess all articles
  } else if (regenerateSummaries) {
    whereClause += ' AND processed_content IS NOT NULL';
  } else if (regenerateRatings) {
    whereClause += ' AND impact_rating IS NOT NULL';
  } else {
    console.log('No reprocessing options specified.');
    stats.endTime = new Date();
    return stats;
  }

  const articles: DBArticle[] = await getArticlesByFilter(whereClause, params, batchSize);

  console.log(`Reprocessing ${articles.length} articles...`);

  for (const article of articles) {
    try {
      if (regenerateSummaries) {
        const summaryPrompt = configManager.getArticleSummaryPrompt(
          article.raw_content.substring(0, 4000)
        );

        const summary = await callDeepseekChat(summaryPrompt);
        if (summary) {
          const finalSummary = `${summary}\n\nSource: [${article.title}](${article.url})`;
          const embedding = await getEmbedding(finalSummary);

          if (embedding) {
            await updateArticleProcessing(article.id, finalSummary, embedding);
            stats.articlesProcessed++;
          }
        }
      }

      if (regenerateRatings && article.processed_content) {
        const ratingPrompt = configManager.getImpactRatingPrompt(article.processed_content);
        const ratingResponse = await callDeepseekChat(ratingPrompt);

        if (ratingResponse) {
          const scoreMatch = ratingResponse.trim().match(/\d+/);
          if (scoreMatch) {
            const score = parseInt(scoreMatch[0], 10);
            if (isValidImpactRating(score)) {
              await updateArticleRating(article.id, score);
              stats.articlesRated++;
            }
          }
        }
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Error reprocessing article ${article.id}:`, error);
      stats.errors++;
    }
  }

  stats.endTime = new Date();
  console.log(`--- Reprocessing Finished. Processed: ${stats.articlesProcessed}, Rated: ${stats.articlesRated} ---`);

  return stats;
}
