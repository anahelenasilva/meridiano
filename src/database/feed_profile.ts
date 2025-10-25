import { db } from ".";

export function getDistinctFeedProfiles(table: 'articles' | 'briefings'): Promise<string[]> {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    db.all(
      `SELECT DISTINCT feed_profile FROM ${table} ORDER BY feed_profile`,
      (err, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows.map(row => row.feed_profile));
        }
      }
    );
  });
}
