import { Router } from 'express';

import { deleteArticle } from './usecases/articles/deleteArticle';
import { getArticle } from './usecases/articles/getArticleById';
import { listArticles } from './usecases/articles/listArticles';
import { getBriefingById } from './usecases/briefings/getBriefingById';
import { listBriefings } from './usecases/briefings/listBriefings';
import { getAvailableProfiles } from './usecases/profiles/getAvailableProfiles';

export const router = Router();

router.get('/api/briefings', listBriefings);

router.get('/api/briefings/:briefId', getBriefingById);

router.get('/api/articles', listArticles);

router.get('/api/articles/:articleId', getArticle);

router.delete('/api/articles/:articleId', deleteArticle);

router.get('/api/profiles', getAvailableProfiles);

router.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
