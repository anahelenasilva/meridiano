import { Readability } from '@mozilla/readability';
import axios from 'axios';
import { JSDOM } from 'jsdom';
import Parser from 'rss-parser';

import { configManager } from './configs/configManager';
import * as database from './database';
import { addArticle } from './database/articles';
import { feedManager } from './feeds/feedManager';
import { ArticleContent } from './types/article';
import { FeedProfile } from './types/feed';
import { ScrapingStats } from './types/scrapper';

const rssParser = new Parser({
  customFields: {
    item: [
      ['media:content', 'mediaContent'],
      ['enclosure', 'enclosures'],
      ['media:thumbnail', 'mediaThumbnail'],
    ],
  },
});

export async function fetchArticleContentAndOgImage(url: string): Promise<ArticleContent> {
  let content: string | null = null;
  let ogImage: string | null = null;

  try {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:137.0) Gecko/20100101 Firefox/137.0',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Cache-Control': 'max-age=0',
      'referer': 'https://www.google.com'
    };

    const response = await axios.get(url, {
      headers,
      timeout: 20000 // 20 seconds timeout
    });

    const htmlContent = response.data;

    // 1. Extract text content using Readability
    const dom = new JSDOM(htmlContent, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (article) {
      content = article.textContent;
    }

    // 2. Extract og:image using JSDOM
    const ogImageElement = dom.window.document.querySelector('meta[property="og:image"]');
    if (ogImageElement) {
      const ogImageContent = ogImageElement.getAttribute('content');
      if (ogImageContent) {
        // Resolve relative URLs
        ogImage = new URL(ogImageContent, url).href;
      }
    }

    return { content, ogImage };

  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error(`Error fetching ${url}:`, error.message);
    } else {
      console.error(`Error processing content/og:image from ${url}:`, error);
    }
    // Return content if it was extracted before the error
    return { content, ogImage: null };
  }
}

function extractRssImageUrl(entry: any): string | null {
  if (entry.enclosures && Array.isArray(entry.enclosures)) {
    for (const enclosure of entry.enclosures) {
      if (enclosure.type && enclosure.type.startsWith('image/') && enclosure.url) {
        return enclosure.url;
      }
    }
  }

  if (entry.mediaContent && Array.isArray(entry.mediaContent)) {
    for (const media of entry.mediaContent) {
      if (media.medium === 'image' && media.url) {
        return media.url;
      }
      if (media.type && media.type.startsWith('image/') && media.url) {
        return media.url;
      }
    }
  }

  if (entry.image && typeof entry.image === 'object' && entry.image.url) {
    return entry.image.url;
  }

  if (entry.mediaThumbnail && entry.mediaThumbnail.url) {
    return entry.mediaThumbnail.url;
  }

  return null;
}

async function articleExists(url: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const db = database.getDbConnection();
    db.get('SELECT id FROM articles WHERE url = ?', [url], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(!!row);
      }
    });
  });
}

export async function scrapeArticles(
  feedProfile: FeedProfile,
  rssFeeds?: string[]
): Promise<ScrapingStats> {
  console.log(`\n--- Starting Article Scraping [${feedProfile}] ---`);

  const stats: ScrapingStats = {
    feedProfile,
    totalFeeds: 0,
    newArticles: 0,
    errors: 0,
    startTime: new Date(),
  };

  const feeds = rssFeeds || feedManager.getEnabledFeedsForProfile(feedProfile).map(f => f.url);

  if (feeds.length === 0) {
    console.log(`Warning: No RSS feeds found for profile '${feedProfile}'. Skipping scrape.`);
    stats.endTime = new Date();
    return stats;
  }

  stats.totalFeeds = feeds.length;

  for (const feedUrl of feeds) {
    console.log(`Fetching feed: ${feedUrl}`);

    try {
      const feed = await rssParser.parseURL(feedUrl);

      const appConfig = configManager.getAppConfig();

      const maxArticlesForScrapping = appConfig.maxArticlesForScrapping || 15;
      const items = feed.items.slice(0, maxArticlesForScrapping);

      console.log('Processing items', {
        totalItemsInFeed: feed.items.length,
        itemsToProcess: items.length,
        maxArticlesForScrapping,
      });

      for (const entry of items) {
        const url = entry.link;
        const title = entry.title || 'No Title';
        const publishedDate = entry.pubDate ? new Date(entry.pubDate) : new Date();
        const feedSource = feed.title || feedUrl;

        if (!url) {
          // console.log(`  Skipping entry with missing URL: ${title}`);
          continue;
        }

        if (await articleExists(url)) {
          // console.log(`  Skipping entry with existing URL: ${title}`);
          continue;
        }

        console.log(`Processing new entry: ${title} (${url})`);

        const rssImageUrl = extractRssImageUrl(entry);
        if (rssImageUrl) {
          console.log(`  Found image in RSS: ${rssImageUrl.substring(0, 60)}...`);
        }

        console.log(`  Fetching article content and OG image...`);
        const { content: rawContent, ogImage: ogImageUrl } = await fetchArticleContentAndOgImage(url);


        if (!rawContent) {
          console.log(`  Skipping article, failed to extract main content: ${title}`);
          stats.errors++;
          continue;
        }

        const finalImageUrl = rssImageUrl || ogImageUrl;
        if (finalImageUrl) {
          console.log(`  Using image URL: ${finalImageUrl.substring(0, 60)}...`);
        } else {
          console.log('  No image found in RSS or OG tags.');
        }

        const articleId = await addArticle(
          url,
          title,
          publishedDate,
          feedSource,
          rawContent,
          feedProfile,
          finalImageUrl || undefined
        );

        if (articleId) {
          stats.newArticles++;
        }

        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error(`Error processing feed ${feedUrl}:`, error);
      stats.errors++;
    }
  }

  stats.endTime = new Date();
  console.log(`--- Scraping Finished [${feedProfile}]. Added ${stats.newArticles} new articles. ---`);

  return stats;
}

export async function scrapeSingleFeed(
  feedUrl: string,
  feedProfile: FeedProfile
): Promise<number> {
  console.log(`Scraping single feed: ${feedUrl}`);

  try {
    const feed = await rssParser.parseURL(feedUrl);
    let newArticles = 0;

    for (const entry of feed.items) {
      const url = entry.link;
      if (!url || await articleExists(url)) continue;

      const title = entry.title || 'No Title';
      const publishedDate = entry.pubDate ? new Date(entry.pubDate) : new Date();
      const feedSource = feed.title || feedUrl;

      const { content: rawContent, ogImage } = await fetchArticleContentAndOgImage(url);

      if (rawContent) {
        const rssImage = extractRssImageUrl(entry);
        const finalImageUrl = rssImage || ogImage;

        const articleId = await addArticle(
          url,
          title,
          publishedDate,
          feedSource,
          rawContent,
          feedProfile,
          finalImageUrl || undefined
        );

        if (articleId) newArticles++;
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return newArticles;
  } catch (error) {
    console.error(`Error scraping feed ${feedUrl}:`, error);
    return 0;
  }
}

export async function validateFeeds(feedUrls: string[]): Promise<{
  valid: string[];
  invalid: Array<{ url: string; error: string }>;
}> {
  const valid: string[] = [];
  const invalid: Array<{ url: string; error: string }> = [];

  for (const url of feedUrls) {
    try {
      await rssParser.parseURL(url);
      valid.push(url);
    } catch (error) {
      invalid.push({
        url,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return { valid, invalid };
}
