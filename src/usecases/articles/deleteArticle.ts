import { Request, Response } from 'express';

import { deleteArticleById } from '../../database/articles';

export async function deleteArticle(req: Request, res: Response) {
  try {
    const articleId = parseInt(req.params.articleId);
    await deleteArticleById(articleId);

    res.json({
      success: true
    });
  } catch (error) {
    console.error('Error deleting article:', error);
    res.status(500).json({ error: 'Error deleting article' });
  }
}
