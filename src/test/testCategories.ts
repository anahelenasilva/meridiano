#!/usr/bin/env node

/**
 * Test script to verify categories are working correctly
 */

import * as database from '../database';
import { getArticlesPaginated } from '../database/articles';

async function testCategories(): Promise<void> {
  try {
    console.log('Initializing database...');
    await database.initDb();

    console.log('Fetching articles with categories...');
    const articles = await getArticlesPaginated({
      page: 1,
      perPage: 5,
      sortBy: 'published_date',
      direction: 'desc'
    });

    console.log(`Found ${articles.length} articles:`);
    articles.forEach(article => {
      console.log(`\nID: ${article.id}`);
      console.log(`Title: ${article.title}`);
      console.log(`Categories: ${article.categories ? article.categories.join(', ') : 'None'}`);
    });

    await database.closeDb();
    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Error testing categories:', error);
    process.exit(1);
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testCategories();
}

export { testCategories };
