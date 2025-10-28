import { ArticleCategory, CountTotalArticlesInput, DBArticle, PaginatedArticleInput } from 'src/types/article';
import { db } from '.';
import { FeedProfile } from '../types/feed';

export function addArticle(
  url: string,
  title: string,
  publishedDate: Date,
  feedSource: string,
  rawContent: string,
  feedProfile: FeedProfile,
  imageUrl?: string,
  categories?: ArticleCategory[]
): Promise<number | null> {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    const stmt = db.prepare(`
      INSERT INTO articles (url, title, published_date, feed_source, raw_content, feed_profile, image_url, categories)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      [url, title, publishedDate.toISOString(), feedSource, rawContent, feedProfile, imageUrl, categories ? JSON.stringify(categories) : null],
      function (err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            // Article already exists
            resolve(null);
          } else {
            reject(err);
          }
        } else {
          resolve(this.lastID);
        }
        stmt.finalize();
      }
    );
  });
}

export function getUnprocessedArticles(feedProfile: FeedProfile, limit: number = 1000): Promise<DBArticle[]> {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    const query = `
      SELECT * FROM articles
      WHERE feed_profile = ? AND processed_content IS NULL
      ORDER BY published_date DESC
      LIMIT ?
    `;

    db.all(query, [feedProfile, limit], (err, rows: any[]) => {
      if (err) {
        reject(err);
      } else {
        const articles = rows.map(row => ({
          ...row,
          published_date: new Date(row.published_date),
          created_at: new Date(row.created_at),
          categories: row.categories ? JSON.parse(row.categories) : undefined,
        }));
        resolve(articles);
      }
    });
  });
}

export function updateArticleProcessing(
  articleId: number,
  processedContent: string,
  embedding: number[]
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    const stmt = db.prepare(`
      UPDATE articles
      SET processed_content = ?, embedding = ?
      WHERE id = ?
    `);

    stmt.run([processedContent, JSON.stringify(embedding), articleId], (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
      stmt.finalize();
    });
  });
}

export function getUnratedArticles(feedProfile: FeedProfile, limit: number = 1000): Promise<DBArticle[]> {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    const query = `
      SELECT * FROM articles
      WHERE feed_profile = ? AND processed_content IS NOT NULL AND impact_rating IS NULL
      ORDER BY published_date DESC
      LIMIT ?
    `;

    db.all(query, [feedProfile, limit], (err, rows: any[]) => {
      if (err) {
        reject(err);
      } else {
        const articles = rows.map(row => ({
          ...row,
          published_date: new Date(row.published_date),
          created_at: new Date(row.created_at),
          categories: row.categories ? JSON.parse(row.categories) : undefined,
        }));
        resolve(articles);
      }
    });
  });
}

export function getUncategorizedArticles(feedProfile: FeedProfile, limit: number = 1000): Promise<DBArticle[]> {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    const query = `
      SELECT * FROM articles
      WHERE feed_profile = ? AND processed_content IS NOT NULL AND categories IS NULL
      ORDER BY published_date DESC
      LIMIT ?
    `;

    db.all(query, [feedProfile, limit], (err, rows: any[]) => {
      if (err) {
        reject(err);
      } else {
        const articles = rows.map(row => ({
          ...row,
          published_date: new Date(row.published_date),
          created_at: new Date(row.created_at),
          categories: row.categories ? JSON.parse(row.categories) : undefined,
        }));
        resolve(articles);
      }
    });
  });
}

export function updateArticleRating(articleId: number, impactRating: number): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    const stmt = db.prepare(`
      UPDATE articles
      SET impact_rating = ?
      WHERE id = ?
    `);

    stmt.run([impactRating, articleId], (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
      stmt.finalize();
    });
  });
}

export function updateArticleCategories(articleId: number, categories: ArticleCategory[]): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    const stmt = db.prepare(`
      UPDATE articles
      SET categories = ?
      WHERE id = ?
    `);

    stmt.run([JSON.stringify(categories), articleId], (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
      stmt.finalize();
    });
  });
}

export function getArticlesForBriefing(
  lookbackHours: number,
  feedProfile: FeedProfile
): Promise<DBArticle[]> {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    const cutoffTime = new Date(Date.now() - lookbackHours * 60 * 60 * 1000);

    const query = `
      SELECT * FROM articles
      WHERE feed_profile = ?
        AND processed_content IS NOT NULL
        AND embedding IS NOT NULL
        AND published_date >= ?
      ORDER BY impact_rating DESC, published_date DESC
    `;

    db.all(query, [feedProfile, cutoffTime.toISOString()], (err, rows: any[]) => {
      if (err) {
        reject(err);
      } else {
        const articles = rows.map(row => ({
          ...row,
          published_date: new Date(row.published_date),
          created_at: new Date(row.created_at),
          categories: row.categories ? JSON.parse(row.categories) : undefined,
        }));
        resolve(articles);
      }
    });
  });
}

export function deleteArticles(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    const stmt = db.prepare(`DELETE FROM articles`);

    stmt.run(
      function (err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            // Article already exists
            resolve();
          } else {
            console.error("Error deleting articles:", err);
            reject(err);
          }
        } else {
          resolve(this.lastID);
        }
        stmt.finalize();
      }
    );
  });
}

export function getTotalArticleCount(options: {
  startDate?: Date;
  endDate?: Date;
  feedProfile?: string;
  searchTerm?: string;
}): Promise<number> {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    let query = 'SELECT COUNT(*) as count FROM articles WHERE 1=1';
    const params: any[] = [];

    if (options.startDate) {
      query += ' AND DATE(published_date) >= DATE(?)';
      params.push(options.startDate.toISOString().split('T')[0]);
    }

    if (options.endDate) {
      query += ' AND DATE(published_date) <= DATE(?)';
      params.push(options.endDate.toISOString().split('T')[0]);
    }

    if (options.feedProfile) {
      query += ' AND feed_profile = ?';
      params.push(options.feedProfile);
    }

    if (options.searchTerm) {
      query += ' AND (title LIKE ? OR processed_content LIKE ?)';
      params.push(`%${options.searchTerm}%`, `%${options.searchTerm}%`);
    }

    db.get(query, params, (err, row: any) => {
      if (err) {
        reject(err);
      } else {
        resolve(row.count);
      }
    });
  });
}

export function getAllArticles(options: {
  page: number;
  perPage: number;
  sortBy: string;
  direction: 'asc' | 'desc';
  startDate?: Date;
  endDate?: Date;
  feedProfile?: string;
  searchTerm?: string;
}): Promise<Array<{
  id: number;
  url: string;
  title: string;
  published_date: Date;
  feed_source: string;
  processed_content?: string;
  impact_rating?: number;
  feed_profile: string;
  image_url?: string;
  created_at: Date;
}>> {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    let query = 'SELECT * FROM articles WHERE 1=1';
    const params: any[] = [];

    // Apply filters
    if (options.startDate) {
      query += ' AND DATE(published_date) >= DATE(?)';
      params.push(options.startDate.toISOString().split('T')[0]);
    }

    if (options.endDate) {
      query += ' AND DATE(published_date) <= DATE(?)';
      params.push(options.endDate.toISOString().split('T')[0]);
    }

    if (options.feedProfile) {
      query += ' AND feed_profile = ?';
      params.push(options.feedProfile);
    }

    if (options.searchTerm) {
      query += ' AND (title LIKE ? OR processed_content LIKE ?)';
      params.push(`%${options.searchTerm}%`, `%${options.searchTerm}%`);
    }

    // Add sorting
    const validSortColumns = ['published_date', 'title', 'impact_rating', 'created_at'];
    const sortBy = validSortColumns.includes(options.sortBy) ? options.sortBy : 'published_date';
    query += ` ORDER BY ${sortBy} ${options.direction.toUpperCase()}`;

    // Add pagination
    const offset = (options.page - 1) * options.perPage;
    query += ' LIMIT ? OFFSET ?';
    params.push(options.perPage, offset);

    db.all(query, params, (err, rows: any[]) => {
      if (err) {
        reject(err);
      } else {
        const articles = rows.map(row => ({
          ...row,
          published_date: new Date(row.published_date),
          created_at: new Date(row.created_at),
        }));
        resolve(articles);
      }
    });
  });
}

export function getArticleById(articleId: number): Promise<DBArticle | null> {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    const query = `
      SELECT
        id, url, title, published_date, feed_source, feed_profile,
        raw_content as content, processed_content, impact_rating,
        image_url, categories, created_at
      FROM articles
      WHERE id = ?
    `;

    db.get(query, [articleId], (err, row: any) => {
      if (err) {
        reject(err);
        return;
      }

      if (row) {
        row.categories = row.categories ? JSON.parse(row.categories) : undefined;
      }

      resolve(row || null);
    });
  });
}

export function getArticlesPaginated(options: PaginatedArticleInput): Promise<DBArticle[]> {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    const {
      page = 1,
      perPage = 20,
      sortBy = 'published_date',
      direction = 'desc',
      feedProfile,
      searchTerm,
      startDate,
      endDate,
      category
    } = options;

    let query = `
      SELECT
        id, url, title, published_date, feed_source, feed_profile,
        raw_content as content, processed_content, impact_rating,
        image_url, categories, created_at
      FROM articles
      WHERE 1=1
    `;
    const params: any[] = [];

    if (feedProfile) {
      query += ' AND feed_profile = ?';
      params.push(feedProfile);
    }

    if (searchTerm) {
      query += ' AND (title LIKE ? OR raw_content LIKE ? OR processed_content LIKE ?)';
      const searchPattern = `%${searchTerm}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    if (startDate) {
      query += ' AND DATE(published_date) >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND DATE(published_date) <= ?';
      params.push(endDate);
    }

    if (category) {
      query += ' AND categories LIKE ?';
      params.push(`%"${category}"%`);
    }

    const validSortColumns = ['published_date', 'title', 'impact_rating', 'created_at'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'published_date';
    const sortDirection = direction === 'asc' ? 'ASC' : 'DESC';
    query += ` ORDER BY ${sortColumn} ${sortDirection}`;

    const offset = (page - 1) * perPage;
    query += ' LIMIT ? OFFSET ?';
    params.push(perPage, offset);

    db.all(query, params, (err, rows: any[]) => {
      if (err) {
        reject(err);
        return;
      }

      const articles = rows.map(row => ({
        ...row,
        categories: row.categories ? JSON.parse(row.categories) : undefined,
      }));

      resolve(articles || []);
    });
  });
}

export function countTotalArticles(options: CountTotalArticlesInput): Promise<number> {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    const { feedProfile, searchTerm, startDate, endDate, category } = options;

    let query = 'SELECT COUNT(*) as count FROM articles WHERE 1=1';
    const params: any[] = [];

    if (feedProfile) {
      query += ' AND feed_profile = ?';
      params.push(feedProfile);
    }

    if (searchTerm) {
      query += ' AND (title LIKE ? OR raw_content LIKE ? OR processed_content LIKE ?)';
      const searchPattern = `%${searchTerm}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    if (startDate) {
      query += ' AND DATE(published_date) >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND DATE(published_date) <= ?';
      params.push(endDate);
    }

    if (category) {
      query += ' AND categories LIKE ?';
      params.push(`%"${category}"%`);
    }

    db.get(query, params, (err, row: any) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(row?.count || 0);
    });
  });
}

export function getRelatedArticles(articleId: number, limit: number = 5): Promise<DBArticle[]> {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    const getOriginalQuery = `
      SELECT feed_profile, published_date
      FROM articles
      WHERE id = ?
    `;

    db.get(getOriginalQuery, [articleId], (err, original: any) => {
      if (err) {
        reject(err);
        return;
      }

      if (!original) {
        resolve([]);
        return;
      }

      const relatedQuery = `
        SELECT
          id, url, title, published_date, feed_source, feed_profile,
          raw_content as content, processed_content, impact_rating,
          image_url, categories, created_at
        FROM articles
        WHERE feed_profile = ?
        AND id != ?
        ORDER BY ABS(julianday(published_date) - julianday(?)) ASC
        LIMIT ?
      `;

      if (!db) {
        reject(new Error('Database not initialized'));
        return;
      }

      db.all(relatedQuery, [original.feed_profile, articleId, original.published_date, limit], (err, rows: any[]) => {
        if (err) {
          reject(err);
          return;
        }

        const articles = rows.map(row => ({
          ...row,
          categories: row.categories ? JSON.parse(row.categories) : undefined,
        }));

        resolve(articles || []);
      });
    });
  });
}

export async function getArticlesByFilter(whereClause: string, params: any[], batchSize: number): Promise<DBArticle[]> {
  return await new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    db.all(
      `SELECT * FROM articles WHERE ${whereClause} ORDER BY published_date DESC LIMIT ?`,
      [...params, batchSize],
      (err, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows.map(row => ({
            ...row,
            published_date: new Date(row.published_date),
            created_at: new Date(row.created_at),
            categories: row.categories ? JSON.parse(row.categories) : undefined,
          })));
        }
      }
    );
  });
}

export function getDistinctCategories(): Promise<string[]> {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    const query = `
      SELECT DISTINCT categories
      FROM articles
      WHERE categories IS NOT NULL AND categories != ''
    `;

    db.all(query, [], (err, rows: any[]) => {
      if (err) {
        reject(err);
        return;
      }

      const categoriesSet = new Set<string>();

      rows.forEach(row => {
        if (row.categories) {
          try {
            const categories = JSON.parse(row.categories);
            if (Array.isArray(categories)) {
              categories.forEach(category => {
                if (typeof category === 'string') {
                  categoriesSet.add(category);
                }
              });
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      });

      resolve(Array.from(categoriesSet).sort());
    });
  });
}
