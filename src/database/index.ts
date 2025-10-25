import * as sqlite3 from 'sqlite3';
import { config } from '../configs/config';

export let db: sqlite3.Database | null = null;

export function initDb(): Promise<void> {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(config.app.databaseFile, (err) => {
      if (err) {
        reject(err);
        return;
      }

      console.log('Connected to SQLite database:', config.app.databaseFile);

      createTables()
        .then(() => resolve())
        .catch(reject);
    });
  });
}

function createTables(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    const createArticlesTable = `
      CREATE TABLE IF NOT EXISTS articles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        published_date DATETIME NOT NULL,
        feed_source TEXT NOT NULL,
        raw_content TEXT NOT NULL,
        processed_content TEXT,
        embedding TEXT,
        impact_rating INTEGER,
        feed_profile TEXT NOT NULL,
        image_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createBriefingsTable = `
      CREATE TABLE IF NOT EXISTS briefings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        article_ids TEXT NOT NULL,
        feed_profile TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    db.serialize(() => {
      db!.run(createArticlesTable, (err) => {
        if (err) {
          reject(err);
          return;
        }
      });

      db!.run(createBriefingsTable, (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  });
}

export function getDbConnection(): sqlite3.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return db;
}

export function closeDb(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!db) {
      resolve();
      return;
    }

    db.close((err) => {
      if (err) {
        reject(err);
      } else {
        console.log('Database connection closed');
        db = null;
        resolve();
      }
    });
  });
}
