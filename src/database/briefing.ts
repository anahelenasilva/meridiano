import { db } from ".";
import { BriefsMetadata, GetBriefByIdResult, ProcessingStatsResult } from "../types/briefing";
import { FeedProfile } from "../types/feed";

export function saveBrief(
  content: string,
  articleIds: number[],
  feedProfile: FeedProfile
): Promise<number> {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    const stmt = db.prepare(`
      INSERT INTO briefings (content, article_ids, feed_profile)
      VALUES (?, ?, ?)
    `);

    stmt.run([content, JSON.stringify(articleIds), feedProfile], function (err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.lastID);
      }
      stmt.finalize();
    });
  });
}

export function getAllBriefsMetadata(feedProfile?: FeedProfile): Promise<BriefsMetadata[]> {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    let query = 'SELECT id, created_at as generated_at, feed_profile FROM briefings';
    const params: any[] = [];

    if (feedProfile) {
      query += ' WHERE feed_profile = ?';
      params.push(feedProfile);
    }

    query += ' ORDER BY created_at DESC';

    db.all(query, params, (err, rows: any[]) => {
      if (err) {
        reject(err);
      } else {
        const briefings = rows.map(row => ({
          id: row.id,
          generated_at: new Date(row.generated_at),
          feed_profile: row.feed_profile,
        }));
        resolve(briefings);
      }
    });
  });
}

export function getBriefById(briefId: number): Promise<GetBriefByIdResult | null> {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    db.get(
      'SELECT id, content as brief_markdown, created_at as generated_at, feed_profile FROM briefings WHERE id = ?',
      [briefId],
      (err, row: any) => {
        if (err) {
          reject(err);
        } else if (!row) {
          resolve(null);
        } else {
          resolve({
            id: row.id,
            brief_markdown: row.brief_markdown,
            generated_at: new Date(row.generated_at),
            feed_profile: row.feed_profile,
          });
        }
      }
    );
  });
}

export function getStats(feedProfile: FeedProfile): Promise<ProcessingStatsResult> {
  return new Promise((resolve, reject) => {
    const queries = [
      'SELECT COUNT(*) as count FROM articles WHERE feed_profile = ?',
      'SELECT COUNT(*) as count FROM articles WHERE feed_profile = ? AND processed_content IS NOT NULL',
      'SELECT COUNT(*) as count FROM articles WHERE feed_profile = ? AND impact_rating IS NOT NULL',
      'SELECT AVG(impact_rating) as avg FROM articles WHERE feed_profile = ? AND impact_rating IS NOT NULL',
    ];

    let results: any[] = [];
    let completed = 0;

    queries.forEach((query, index) => {
      if (!db) {
        reject(new Error('Database not initialized'));
        return;
      }

      db.get(query, [feedProfile], (err, row: any) => {
        if (err) {
          reject(err);
          return;
        }

        results[index] = row;
        completed++;

        if (completed === queries.length) {
          const total = results[0].count;
          const processed = results[1].count;
          const rated = results[2].count;
          const averageRating = results[3].avg;

          resolve({
            total,
            processed,
            rated,
            unprocessed: total - processed,
            unrated: processed - rated,
            averageRating: averageRating ? Math.round(averageRating * 100) / 100 : undefined,
          });
        }
      });
    });
  });
}
