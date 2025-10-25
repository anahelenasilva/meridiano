import { db } from ".";
import { GetBriefByIdResult } from "../types/briefing";
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


export function getAllBriefsMetadata(feedProfile?: FeedProfile): Promise<Array<{
  id: number;
  generated_at: Date;
  feed_profile: string;
}>> {
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
