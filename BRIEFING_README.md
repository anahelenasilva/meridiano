# Meridian Briefing System - TypeScript Edition

A comprehensive AI-powered news analysis and briefing generation system, converted from Python to TypeScript with enhanced features and type safety.

## 🚀 Features

- **RSS Feed Scraping**: Automated article collection from multiple RSS sources
- **AI-Powered Processing**: Article summarization and content analysis using Deepseek AI
- **Smart Clustering**: ML-based article clustering for thematic grouping
- **Impact Rating**: Automated assessment of article significance (1-10 scale)
- **Briefing Generation**: Professional intelligence briefings with Markdown formatting
- **Multi-Profile Support**: Different feed configurations (technology, politics, etc.)
- **Type Safety**: Full TypeScript implementation with comprehensive type definitions
- **Modular Architecture**: Clean separation of concerns with reusable modules

## 📋 Prerequisites

- Node.js 18+ and npm
- SQLite3
- API Keys:
  - **DEEPSEEK_API_KEY**: For article summarization and analysis
  - **EMBEDDING_API_KEY**: For semantic embeddings (Together AI)

## 🛠️ Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

3. **Type check the project**:
   ```bash
   npm run typecheck
   ```

## 🎯 Quick Start

### Command Line Interface

```bash
# Run complete briefing workflow for technology profile
npm run briefing:tech

# Run all stages for default profile
npm run briefing

# Run specific stages
npm run briefing:scrape     # Scrape articles only
npm run briefing:process    # Process articles only
npm run briefing:rate       # Rate articles only
npm run briefing:generate   # Generate brief only

# System utilities
npm run briefing:status     # Show system status
npm run briefing:simple     # Generate simple brief without clustering

# Custom feed profile
npm run briefing -- --feed technology --generate
```

### Programmatic Usage

```typescript
import { initializeClients, testApiConnectivity } from './src/apiClients';
import * as database from './src/database';
import { scrapeArticles } from './src/scraper';
import { processArticles, rateArticles } from './src/processor';
import { generateBrief } from './src/briefing';

async function runBriefing() {
  // Initialize system
  await database.initDb();
  initializeClients();

  // Run workflow
  await scrapeArticles('technology');
  await processArticles('technology');
  await rateArticles('technology');

  const result = await generateBrief('technology');
  console.log('Brief generated:', result.success);
}
```

## 🏗️ Architecture

### Core Modules

- **`apiClients.ts`**: OpenAI/Deepseek API integrations
- **`database.ts`**: SQLite database operations
- **`scraper.ts`**: RSS feed parsing and content extraction
- **`processor.ts`**: Article summarization and rating
- **`briefing.ts`**: Clustering and brief generation
- **`runBriefing.ts`**: CLI interface and workflow orchestration

### Configuration System

- **`configs/config.ts`**: Main configuration with prompts and settings
- **`configs/configManager.ts`**: Advanced configuration management
- **`feeds/tech.ts`**: Technology feed configuration
- **`feeds/feedManager.ts`**: Multi-profile feed management

### Type Definitions

- **`types.ts`**: Comprehensive TypeScript interfaces
- Full type safety for all data structures
- Runtime validation with type guards

## 📊 Feed Profiles

### Technology Profile (`feeds/tech.ts`)

**RSS Sources (15 feeds)**:
- **News**: TechCrunch, The Verge, WIRED
- **Security**: Krebs on Security, BleepingComputer, The Hacker News
- **Hardware**: Tom's Hardware, Ars Technica
- **Asia/China**: SCMP Tech sections (6 specialized feeds)

**Categories**:
- `cybersecurity`: Security-focused feeds
- `startup`: Startup and venture capital news
- `hardware`: Hardware reviews and news
- `china-tech`: Chinese technology developments
- `gaming`: Apps and gaming coverage
- `science`: Research and innovation

**Custom Prompts**:
- Optimized for tech briefings
- YouTube channel formatting
- Source attribution with numbered references

## 🎛️ Configuration

### Environment Variables

```bash
# Required API Keys
DEEPSEEK_API_KEY=your_deepseek_api_key
EMBEDDING_API_KEY=your_together_ai_key

# Optional Settings
NODE_ENV=development
DATABASE_FILE=meridian.db
```

### Configuration Files

**Main Config** (`configs/config.ts`):
```typescript
export const config = {
  prompts: {
    articleSummary: "...",
    impactRating: "...",
    // ...
  },
  processing: {
    briefingArticleLookbackHours: 24,
    minArticlesForBriefing: 5,
    nClusters: 10,
  },
  models: {
    deepseekChatModel: "deepseek-chat",
    embeddingModel: "togethercomputer/m2-bert-80M-32k-retrieval",
  },
};
```

**Feed Configuration** (`feeds/tech.ts`):
```typescript
export const techRSSFeeds: RSSFeed[] = [
  {
    url: "https://techcrunch.com/feed/",
    name: "TechCrunch",
    category: "startup",
    description: "Technology startup news",
    enabled: true,
  },
  // ...
];
```

## 🔄 Workflow

1. **Scraping**: Parse RSS feeds, extract content and metadata
2. **Processing**: Generate AI summaries and embeddings
3. **Rating**: Assess article impact (1-10 scale)
4. **Clustering**: Group related articles using ML
5. **Analysis**: Generate cluster analyses
6. **Synthesis**: Create final briefing in Markdown

## 📈 Key Improvements Over Python Version

### Type Safety
- Compile-time error checking
- IntelliSense support
- Robust interface definitions

### Enhanced Feed Management
```typescript
// Rich metadata vs simple URL lists
const feed = {
  url: "https://techcrunch.com/feed/",
  name: "TechCrunch",
  category: "startup",
  description: "Technology startup news",
  enabled: true,
};

// Advanced querying
const cybersecFeeds = getFeedsByCategory('cybersecurity');
const searchResults = feedManager.searchFeeds('security');
```

### Modular Architecture
- Clean separation of concerns
- Reusable components
- Easy to extend and maintain

### Better Error Handling
- Comprehensive error types
- Graceful degradation
- Detailed logging

### Performance Monitoring
- Built-in timing and statistics
- Resource usage tracking
- Performance optimization

## 🧪 Testing and Examples

```bash
# Run example workflows
npm run examples

# Check system status
npm run briefing:status

# Validate configuration
npm run typecheck
```

Example workflows in `briefingExamples.ts`:
- Complete briefing workflow
- Custom briefing generation
- Feed configuration management
- Performance monitoring
- Error handling patterns

## 🔧 Advanced Usage

### Custom Feed Profiles

1. Create new feed configuration:
```typescript
// src/feeds/politics.ts
export const politicsRSSFeeds: RSSFeed[] = [
  // Your political news feeds
];

export const politicsFeedConfig: FeedConfiguration = {
  profile: 'politics',
  rssFeeds: politicsRSSFeeds,
  prompts: {
    // Custom prompts for political analysis
  },
};
```

2. Register with feed manager:
```typescript
feedManager.registerFeedConfig(politicsFeedConfig);
```

### Custom Briefing Generation

```typescript
const customBrief = await generateBrief('technology', {
  feedProfile: 'technology',
  lookbackHours: 48,
  minArticles: 3,
  customPrompts: {
    briefSynthesis: `Custom prompt for specialized briefing...`,
  },
});
```

### Database Operations

```typescript
// Get processing statistics
const stats = await getProcessingStats('technology');

// Reprocess articles with new prompts
await reprocessArticles('technology', {
  regenerateSummaries: true,
  batchSize: 50,
});
```

## 📚 API Reference

### Core Functions

- `scrapeArticles(feedProfile, rssFeeds?)`: Scrape and store articles
- `processArticles(feedProfile, limit?)`: Generate summaries and embeddings
- `rateArticles(feedProfile, limit?)`: Generate impact ratings
- `generateBrief(feedProfile, options?)`: Create clustered briefing
- `generateSimpleBrief(feedProfile, maxArticles?)`: Create simple briefing

### Configuration Management

- `configManager.getPrompt(type, variables)`: Get formatted prompts
- `feedManager.getFeedsForProfile(profile)`: Get feeds for profile
- `feedManager.searchFeeds(query)`: Search feeds by keywords

### Database Operations

- `database.addArticle(...)`: Store new article
- `database.getArticlesForBriefing(hours, profile)`: Get articles for analysis
- `database.saveBrief(content, articleIds, profile)`: Store generated brief

## 🐛 Troubleshooting

### Common Issues

1. **API Key Errors**: Ensure `DEEPSEEK_API_KEY` and `EMBEDDING_API_KEY` are set
2. **Database Errors**: Check SQLite permissions and disk space
3. **Feed Parsing**: Validate RSS feed URLs with `--status` command
4. **Memory Issues**: Reduce batch sizes in configuration

### Debug Mode

```bash
# Enable verbose logging
DEBUG=* npm run briefing

# Check API connectivity
npm run briefing:status
```

## 📝 License

MIT License - See LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

---

**Meridian Briefing System** - AI-powered news intelligence with TypeScript reliability and modern architecture.
