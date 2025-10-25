import { Request, Response } from 'express';
import moment from 'moment';

import { countTotalArticles, getArticlesPaginated } from '../../database/articles';
import { getDistinctFeedProfiles } from '../../database/feed_profile';
import { prepareArticleContent } from './prepareArticleContent';

export async function listArticles(req: Request, res: Response) {
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
}

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
