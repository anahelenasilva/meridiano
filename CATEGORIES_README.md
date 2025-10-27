# Article Categories Implementation

This document describes the implementation of article categories in the Meridiano system.

## Overview

The system now automatically categorizes articles using AI classification. Each article can have multiple categories from a predefined set of options.

## Available Categories

The system supports the following categories (defined in `src/types/article.ts`):

- `news`: General news articles
- `blog`: Blog posts or opinion pieces
- `research`: Research papers or technical studies
- `nodejs`: Node.js related content
- `typescript`: TypeScript related content
- `tutorial`: Tutorials or how-to guides
- `other`: Content that doesn't fit other categories

## Database Changes

### Schema Update
- Added `categories` column to the `articles` table as TEXT (stores JSON array)
- Migration script available at `src/database/migrate.ts`

### Functions Added
- `updateArticleCategories(articleId, categories)`: Update article categories
- `getUncategorizedArticles(feedProfile, limit)`: Get articles without categories
- Updated all retrieval functions to parse categories from JSON

## AI Classification

### Prompt Configuration
Added `categoryClassification` prompt in `src/configs/config.ts` that:
- Analyzes article title and content
- Returns a JSON array of 1-3 most relevant categories
- Validates against the predefined category enum

### Processing Function
New `categorizeArticles(feedProfile, limit)` function in `src/processor.ts`:
- Processes articles that have summaries but no categories
- Uses AI to classify each article
- Validates and stores the results
- Falls back to 'other' category if classification fails

## CLI Integration

Updated `runBriefing.ts` to include categorization:
- Added `--categorize` option to run only categorization
- Integrated categorization as Stage 4 in the full pipeline
- Added `runCategorization()` function

## Usage

### Full Pipeline (includes categorization)
```bash
npx ts-node src/runBriefing.ts --feed technology --all
```

### Categorization Only
```bash
npx ts-node src/runBriefing.ts --feed technology --categorize
```

### Migration (one-time setup)
```bash
npx ts-node src/database/migrate.ts
```

## Processing Order

The recommended processing order is now:
1. **Scraping**: Collect articles from feeds
2. **Processing**: Generate summaries and embeddings
3. **Rating**: Assign impact ratings
4. **Categorization**: Classify articles (NEW)
5. **Brief Generation**: Create briefings

## API Integration

The existing API endpoints automatically include categories in article responses:
- `GET /api/articles` - Lists articles with categories
- `GET /api/articles/:id` - Shows article details with categories

## Example Output

```json
{
  "id": 123,
  "title": "Building a REST API with Node.js",
  "categories": ["tutorial", "nodejs"],
  "published_date": "2025-10-27T10:00:00Z",
  // ... other fields
}
```

## Testing

Test script available at `src/test/testCategories.ts` to verify:
- Categories are properly stored and retrieved
- JSON parsing works correctly
- API responses include categories

## Performance Notes

- Categorization uses the same AI service as summarization and rating
- Includes 1-second rate limiting between requests
- Processes only articles that have summaries but no categories
- Typical categorization time: ~1 second per article
