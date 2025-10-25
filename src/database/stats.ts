import { db } from ".";
import { GetStatusResult } from "../types/stats";

export function getDatabaseStats(): Promise<GetStatusResult> {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    const queries = [
      'SELECT COUNT(*) as count FROM articles',
      'SELECT COUNT(*) as count FROM articles WHERE processed_content IS NOT NULL',
      'SELECT COUNT(*) as count FROM articles WHERE impact_rating IS NOT NULL',
      'SELECT COUNT(*) as count FROM briefings'
    ];

    let results: number[] = [];
    let completed = 0;

    queries.forEach((query, index) => {
      db!.get(query, (err, row: any) => {
        if (err) {
          reject(err);
          return;
        }
        results[index] = row.count;
        completed++;

        if (completed === queries.length) {
          resolve({
            totalArticles: results[0],
            processedArticles: results[1],
            ratedArticles: results[2],
            totalBriefings: results[3],
          });
        }
      });
    });
  });
}
