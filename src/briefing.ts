import { kmeans } from 'ml-kmeans';

import { callDeepseekChat } from './apiClients';
import config from './configs/config';
import { configManager } from './configs/configManager';
import * as database from './database';
import { getArticlesForBriefing } from './database/articles';
import { saveBrief } from './database/briefing';
import { BriefGenerationOptions, GenerateBriefResult, GetBriefingTrendsResult, RecentBriefingResult, SimpleBriefResult } from './types/briefing';
import { FeedProfile } from './types/feed';
import { ClusterAnalysis, DBArticle } from './types/scrapper';

function clusterArticles(
  embeddings: number[][],
  nClusters: number
): number[] {
  if (embeddings.length < 2) {
    return embeddings.map(() => 0);
  }

  const effectiveClusters = Math.min(nClusters, Math.floor(embeddings.length / 2));

  if (effectiveClusters < 2) {
    return embeddings.map(() => 0);
  }

  try {
    const result = kmeans(embeddings, effectiveClusters, {});

    return result.clusters;
  } catch (error) {
    console.error('Error during clustering:', error);
    // Fallback: assign all articles to cluster 0
    return embeddings.map(() => 0);
  }
}

async function analyzeCluster(
  clusterArticles: DBArticle[],
  feedProfile: FeedProfile,
  clusterIndex: number,
  customPrompt?: string
): Promise<ClusterAnalysis | null> {
  if (clusterArticles.length === 0) {
    return null;
  }

  console.log(`  Analyzing Cluster ${clusterIndex} (${clusterArticles.length} articles)`);

  // Limit number of summaries per cluster to avoid token limits
  const maxSummariesPerCluster = 10;
  const selectedArticles = clusterArticles.slice(0, maxSummariesPerCluster);

  const clusterSummariesText = selectedArticles
    .map(article => `- ${article.processed_content}`)
    .join('\n\n');

  const analysisPrompt = configManager.getClusterAnalysisPrompt(
    feedProfile,
    clusterSummariesText,
    customPrompt
  );

  const clusterAnalysis = await callDeepseekChat(analysisPrompt);

  if (!clusterAnalysis) {
    return null;
  }

  // Filter out clusters that are explicitly marked as unrelated
  // unless they have multiple articles (might still be worth including)
  if (clusterAnalysis.toLowerCase().includes('unrelated') && clusterArticles.length <= 2) {
    return null;
  }

  return {
    topic: `Cluster ${clusterIndex + 1}`,
    analysis: clusterAnalysis,
    size: clusterArticles.length,
    articles: clusterArticles,
  };
}

export async function generateBrief(
  feedProfile: FeedProfile,
  options: Partial<BriefGenerationOptions> = {}
): Promise<GenerateBriefResult> {
  console.log(`\n--- Starting Brief Generation [${feedProfile}] ---`);

  const briefingConfig = configManager.getBriefingConfig({
    feedProfile,
    lookbackHours: options.lookbackHours,
    minArticles: options.minArticles,
    customPrompts: options.customPrompts,
  });

  const articles = await getArticlesForBriefing(
    briefingConfig.lookbackHours,
    feedProfile
  );

  if (!articles || articles.length < briefingConfig.minArticles) {
    const error = `Not enough recent articles (${articles?.length || 0}) for profile '${feedProfile}'. Min required: ${briefingConfig.minArticles}.`;
    console.log(error);
    return { success: false, error };
  }

  console.log(`Generating brief from ${articles.length} articles.`);

  const articleIds = articles.map(a => a.id);
  const summaries = articles.map(a => a.processed_content!);

  const articlesWithEmbeddings = articles.filter(a => a.embedding);

  if (articlesWithEmbeddings.length !== articles.length) {
    console.log(`Warning: ${articles.length - articlesWithEmbeddings.length} articles are missing embeddings. Proceeding with available ones.`);
  }

  if (articlesWithEmbeddings.length < briefingConfig.minArticles) {
    const error = `Not enough articles (${articlesWithEmbeddings.length}) with embeddings to cluster. Min required: ${briefingConfig.minArticles}.`;
    console.log(error);
    return { success: false, error };
  }

  const embeddings = articlesWithEmbeddings.map(a => JSON.parse(a.embedding!));

  const nClusters = Math.min(briefingConfig.nClusters, Math.floor(articlesWithEmbeddings.length / 2));

  if (nClusters < 2) {
    console.log('Not enough articles to form meaningful clusters. Skipping clustering.');
    return {
      success: false,
      error: 'Not enough articles to form meaningful clusters'
    };
  }

  console.log(`Clustering ${embeddings.length} articles into ${nClusters} clusters...`);

  const clusterLabels = clusterArticles(embeddings, nClusters);

  const clusterGroups: DBArticle[][] = Array(nClusters).fill(null).map(() => []);

  articlesWithEmbeddings.forEach((article, index) => {
    const clusterLabel = clusterLabels[index];
    if (clusterLabel >= 0 && clusterLabel < nClusters) {
      clusterGroups[clusterLabel].push(article);
    }
  });

  console.log('Analyzing clusters...');
  const clusterAnalyses: ClusterAnalysis[] = [];

  for (let i = 0; i < clusterGroups.length; i++) {
    const clusterArticles = clusterGroups[i];

    if (clusterArticles.length === 0) continue;

    const analysis = await analyzeCluster(
      clusterArticles,
      feedProfile,
      i,
      options.customPrompts?.clusterAnalysis
    );

    if (analysis) {
      clusterAnalyses.push(analysis);
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  if (clusterAnalyses.length === 0) {
    const error = 'No meaningful clusters found or analyzed.';
    console.log(error);
    return { success: false, error };
  }

  // Sort clusters by size (number of articles) to prioritize major themes
  clusterAnalyses.sort((a, b) => b.size - a.size);

  const briefSynthesisPrompt = configManager.getBriefSynthesisPrompt(
    feedProfile,
    generateClusterAnalysesText(clusterAnalyses.slice(0, 5)), // Use top 5 clusters
    options.customPrompts?.briefSynthesis
  );

  const finalBriefMarkdown = await callDeepseekChat(briefSynthesisPrompt);

  if (!finalBriefMarkdown) {
    const error = 'Could not synthesize final brief.';
    console.log(`--- Brief Generation Failed [${feedProfile}]: ${error} ---`);
    return { success: false, error };
  }

  try {
    const briefingId = await saveBrief(finalBriefMarkdown, articleIds, feedProfile);

    console.log(`--- Brief Generation Finished Successfully [${feedProfile}] ---`);

    return {
      success: true,
      briefingId,
      content: finalBriefMarkdown,
      stats: {
        articlesAnalyzed: articlesWithEmbeddings.length,
        clustersGenerated: nClusters,
        clustersUsed: clusterAnalyses.length,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save brief',
    };
  }
}

function generateClusterAnalysesText(clusters: ClusterAnalysis[]): string {
  return clusters
    .map((cluster, index) =>
      `--- Cluster ${index + 1} (${cluster.size} articles) ---\nAnalysis: ${cluster.analysis}\n`
    )
    .join('\n');
}

export async function generateSimpleBrief(
  feedProfile: FeedProfile,
  maxArticles: number = 10
): Promise<SimpleBriefResult> {
  console.log(`\n--- Generating Simple Brief [${feedProfile}] ---`);

  const articles = await getArticlesForBriefing(
    config.processing.briefingArticleLookbackHours,
    feedProfile
  );

  if (!articles || articles.length === 0) {
    return { success: false, error: 'No articles found for briefing' };
  }

  const selectedArticles = articles
    .sort((a, b) => (b.impact_rating || 0) - (a.impact_rating || 0))
    .slice(0, maxArticles);

  const summariesText = selectedArticles
    .map((article, index) =>
      `${index + 1}. **${article.title}** (Impact: ${article.impact_rating || 'N/A'})\n   ${article.processed_content}\n`
    )
    .join('\n');

  const briefPrompt = `Create a concise briefing for the '${feedProfile}' profile based on these recent articles:

${summariesText}

Format as a professional briefing with:
1. Executive Summary (2-3 key themes)
2. Key Developments (bullet points)
3. Analysis and Implications

Use Markdown formatting.`;

  const briefContent = await callDeepseekChat(briefPrompt);

  if (!briefContent) {
    return { success: false, error: 'Failed to generate brief content' };
  }

  try {
    const briefingId = await saveBrief(
      briefContent,
      selectedArticles.map(a => a.id),
      feedProfile
    );

    return {
      success: true,
      briefingId,
      content: briefContent,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save brief',
    };
  }
}

export async function getRecentBriefings(
  feedProfile: FeedProfile,
  limit: number = 10
): Promise<Array<RecentBriefingResult>> {
  return new Promise((resolve, reject) => {
    const db = database.getDbConnection();

    db.all(
      `SELECT id, content, article_ids, created_at
       FROM briefings
       WHERE feed_profile = ?
       ORDER BY created_at DESC
       LIMIT ?`,
      [feedProfile, limit],
      (err, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          const briefings = rows.map(row => ({
            id: row.id,
            content: row.content,
            articleCount: JSON.parse(row.article_ids).length,
            createdAt: new Date(row.created_at),
          }));
          resolve(briefings);
        }
      }
    );
  });
}

export async function getBriefingTrends(
  feedProfile: FeedProfile,
  days: number = 7
): Promise<GetBriefingTrendsResult> {
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  return new Promise((resolve, reject) => {
    const db = database.getDbConnection();

    db.all(
      `SELECT article_ids, created_at
       FROM briefings
       WHERE feed_profile = ? AND created_at >= ?
       ORDER BY created_at DESC`,
      [feedProfile, cutoffDate.toISOString()],
      (err, rows: any[]) => {
        if (err) {
          reject(err);
          return;
        }

        const briefings = rows.map(row => ({
          articleIds: JSON.parse(row.article_ids),
          createdAt: new Date(row.created_at),
        }));

        const totalBriefings = briefings.length;
        const avgArticlesPerBrief = totalBriefings > 0
          ? briefings.reduce((sum, b) => sum + b.articleIds.length, 0) / totalBriefings
          : 0;

        const briefingsByDay = new Map<string, number>();

        for (let i = 0; i < days; i++) {
          const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
          const dateStr = date.toISOString().split('T')[0];
          briefingsByDay.set(dateStr, 0);
        }

        briefings.forEach(briefing => {
          const dateStr = briefing.createdAt.toISOString().split('T')[0];
          briefingsByDay.set(dateStr, (briefingsByDay.get(dateStr) || 0) + 1);
        });

        const briefingsPerDay = Array.from(briefingsByDay.entries())
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => a.date.localeCompare(b.date));

        resolve({
          totalBriefings,
          avgArticlesPerBrief: Math.round(avgArticlesPerBrief * 100) / 100,
          briefingsPerDay,
        });
      }
    );
  });
}
