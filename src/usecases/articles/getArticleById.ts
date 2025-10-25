import { Request, Response } from 'express';

import { getArticleById, getRelatedArticles } from '../../database/articles';
import { prepareArticleContent } from './prepareArticleContent';

export async function getArticle(req: Request, res: Response) {
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
}
