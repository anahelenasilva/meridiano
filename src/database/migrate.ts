#!/usr/bin/env node

/**
 * Migration script to add categories column to articles table
 * Run this script to update existing databases with the new categories field
 */

import * as sqlite3 from 'sqlite3';
import { config } from '../configs/config';

async function migrateDatabaseSchema(): Promise<void> {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(config.app.databaseFile, (err) => {
      if (err) {
        reject(err);
        return;
      }

      console.log('Connected to database:', config.app.databaseFile);

      // Check if categories column already exists
      db.get("PRAGMA table_info(articles)", (err, result) => {
        if (err) {
          reject(err);
          return;
        }

        // Check if categories column exists
        db.all("PRAGMA table_info(articles)", (err, columns: any[]) => {
          if (err) {
            reject(err);
            return;
          }

          const hasCategories = columns.some(col => col.name === 'categories');

          if (hasCategories) {
            console.log('Categories column already exists. No migration needed.');
            db.close();
            resolve();
            return;
          }

          console.log('Adding categories column to articles table...');

          // Add the categories column
          db.run("ALTER TABLE articles ADD COLUMN categories TEXT", (err) => {
            if (err) {
              reject(err);
              return;
            }

            console.log('Migration completed successfully!');
            console.log('Categories column added to articles table.');

            db.close((err) => {
              if (err) {
                reject(err);
              } else {
                resolve();
              }
            });
          });
        });
      });
    });
  });
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateDatabaseSchema()
    .then(() => {
      console.log('Database migration completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export { migrateDatabaseSchema };
