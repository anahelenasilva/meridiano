import express = require('express');
import cors = require('cors');
import { marked } from 'marked';
import moment = require('moment');

import { initDb, } from './database';
import { countTotalArticles, getArticleById, getArticlesPaginated, getRelatedArticles } from './database/articles';
import { getAllBriefsMetadata, getBriefById } from './database/briefing';
import { getDistinctFeedProfiles } from './database/feed_profile';

const app = express();
const PORT = process.env.PORT || 3001; // Changed port to avoid conflict with Vite

// Middleware
app.use(cors()); // Enable CORS for frontend
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

function parseDatePreset(preset: string): { startDate?: string; endDate?: string } {
  const now = moment();

  switch (preset) {
    case 'yesterday':
      const yesterday = now.clone().subtract(1, 'day');
      return {
        startDate: yesterday.format('YYYY-MM-DD'),
        endDate: yesterday.format('YYYY-MM-DD')
      };
    case 'last_week':
      return {
        startDate: now.clone().subtract(7, 'days').format('YYYY-MM-DD'),
        endDate: now.format('YYYY-MM-DD')
      };
    case 'last_30d':
      return {
        startDate: now.clone().subtract(30, 'days').format('YYYY-MM-DD'),
        endDate: now.format('YYYY-MM-DD')
      };
    case 'last_3m':
      return {
        startDate: now.clone().subtract(3, 'months').format('YYYY-MM-DD'),
        endDate: now.format('YYYY-MM-DD')
      };
    case 'last_12m':
      return {
        startDate: now.clone().subtract(12, 'months').format('YYYY-MM-DD'),
        endDate: now.format('YYYY-MM-DD')
      };
    default:
      return {};
  }
}

function prepareArticleContent(article: any) {
  return {
    ...article,
    processed_content_html: article.processed_content ? marked.parse(article.processed_content) : null,
    content_html: article.content ? marked.parse(article.content) : null
  };
}

// API Routes

app.get('/api/briefings', async (req, res) => {
  try {
    const feedProfile = req.query.feed_profile as string || '';
    const availableProfiles = await getDistinctFeedProfiles('articles');
    const briefings = await getAllBriefsMetadata(feedProfile || undefined);

    res.json({
      briefings,
      current_feed_profile: feedProfile,
      available_profiles: availableProfiles
    });
  } catch (error) {
    console.error('Error loading briefings:', error);
    res.status(500).json({ error: 'Error loading briefings' });
  }
});

app.get('/api/briefings/:briefId', async (req, res) => {
  try {
    const briefId = parseInt(req.params.briefId);
    const brief = await getBriefById(briefId);

    if (!brief) {
      return res.status(404).json({ error: 'Briefing not found' });
    }

    res.json({ brief });
  } catch (error) {
    console.error('Error loading briefing:', error);
    res.status(500).json({ error: 'Error loading briefing' });
  }
});

app.get('/api/articles', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const perPage = 20;
    const sortBy = req.query.sort_by as string || 'published_date';
    const direction = req.query.direction as string || 'desc';
    const feedProfile = req.query.feed_profile as string || '';
    const searchTerm = req.query.search as string || '';
    const preset = req.query.preset as string || '';

    let startDate = req.query.start_date as string || '';
    let endDate = req.query.end_date as string || '';

    if (preset) {
      const presetDates = parseDatePreset(preset);
      if (presetDates.startDate) startDate = presetDates.startDate;
      if (presetDates.endDate) endDate = presetDates.endDate;
    }

    const availableProfiles = await getDistinctFeedProfiles('articles');

    const totalArticles = await countTotalArticles({
      feedProfile: feedProfile || undefined,
      searchTerm: searchTerm || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined
    });

    const totalPages = Math.ceil(totalArticles / perPage);

    const articles = await getArticlesPaginated({
      page,
      perPage,
      sortBy,
      direction: direction as 'asc' | 'desc',
      feedProfile: feedProfile || undefined,
      searchTerm: searchTerm || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined
    });

    // Prepare articles with HTML content
    const preparedArticles = articles.map(prepareArticleContent);

    res.json({
      articles: preparedArticles,
      pagination: {
        page,
        per_page: perPage,
        total_pages: totalPages,
        total_articles: totalArticles,
      },
      filters: {
        sort_by: sortBy,
        direction: direction,
        feed_profile: feedProfile,
        search_term: searchTerm,
        start_date: startDate,
        end_date: endDate,
        preset: preset,
      },
      available_profiles: availableProfiles
    });
  } catch (error) {
    console.error('Error loading articles:', error);
    res.status(500).json({ error: 'Error loading articles' });
  }
});

app.get('/api/articles/:articleId', async (req, res) => {
  try {
    const articleId = parseInt(req.params.articleId);
    const article = await getArticleById(articleId);

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const relatedArticles = await getRelatedArticles(articleId, 5);

    // Prepare article and related articles with HTML content
    const preparedArticle = prepareArticleContent(article);
    const preparedRelatedArticles = relatedArticles.map(prepareArticleContent);

    res.json({
      article: preparedArticle,
      related_articles: preparedRelatedArticles
    });
  } catch (error) {
    console.error('Error loading article:', error);
    res.status(500).json({ error: 'Error loading article' });
  }
});

app.get('/api/profiles', async (req, res) => {
  try {
    const availableProfiles = await getDistinctFeedProfiles('articles');
    res.json({ profiles: availableProfiles });
  } catch (error) {
    console.error('Error loading profiles:', error);
    res.status(500).json({ error: 'Error loading profiles' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

async function startServer() {
  try {
    await initDb();
    console.log('📦 Database initialized');

    app.listen(PORT, () => {
      console.log(`🚀 Meridiano API server running on http://localhost:${PORT}`);
      console.log(`📊 API endpoints:`);
      console.log(`   GET /api/briefings - List briefings`);
      console.log(`   GET /api/briefings/:id - Get briefing details`);
      console.log(`   GET /api/articles - List articles`);
      console.log(`   GET /api/articles/:id - Get article details`);
      console.log(`   GET /api/profiles - Get available feed profiles`);
      console.log(`   GET /api/health - Health check`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
