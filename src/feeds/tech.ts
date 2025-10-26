import { FeedConfiguration, RSSFeed } from '../types/feed';

export const techRSSFeeds: RSSFeed[] = [
  {
    url: "https://techcrunch.com/feed/",
    name: "TechCrunch",
    category: "startup",
    description: "Technology startup news and venture capital",
    enabled: true,
  },
  {
    url: "https://www.tabnews.com.br/recentes/rss",
    name: "TabNews",
    category: "technical",
    description: "Technology articles and news; it's also a Brazilian platform and community",
    enabled: true,
  },
  {
    url: "https://www.theverge.com/rss/index.xml",
    name: "The Verge",
    category: "consumer-tech",
    description: "Consumer technology and culture",
    enabled: true,
  },
  {
    url: "https://arstechnica.com/feed/",
    name: "Ars Technica",
    category: "technical",
    description: "In-depth technology analysis and science",
    enabled: true,
  },
  {
    url: "https://krebsonsecurity.com/feed/",
    name: "Krebs on Security",
    category: "cybersecurity",
    description: "Cybersecurity news and investigative reporting",
    enabled: true,
  },
  {
    url: "https://feeds.feedburner.com/TheHackersNews",
    name: "The Hacker News",
    category: "cybersecurity",
    description: "Cybersecurity and hacking news",
    enabled: true,
  },
  {
    url: "https://www.bleepingcomputer.com/feed/",
    name: "BleepingComputer",
    category: "cybersecurity",
    description: "Computer security and malware news",
    enabled: true,
  },
  {
    url: "https://www.tomshardware.com/feeds/all",
    name: "Tom's Hardware",
    category: "hardware",
    description: "Computer hardware reviews and news",
    enabled: true,
  },
  {
    url: "https://www.scmp.com/rss/36/feed",
    name: "SCMP Tech",
    category: "asia-tech",
    description: "South China Morning Post - Technology",
    enabled: true,
  },
  {
    url: "https://www.scmp.com/rss/320663/feed",
    name: "SCMP China Tech",
    category: "china-tech",
    description: "SCMP - China Technology",
    enabled: true,
  },
  {
    url: "https://www.scmp.com/rss/318220/feed",
    name: "SCMP Startups",
    category: "startup",
    description: "SCMP - Startups",
    enabled: true,
  },
  {
    url: "https://www.scmp.com/rss/318221/feed",
    name: "SCMP Apps & Gaming",
    category: "gaming",
    description: "SCMP - Apps and Gaming",
    enabled: true,
  },
  {
    url: "https://www.scmp.com/rss/318224/feed",
    name: "SCMP Science & Research",
    category: "science",
    description: "SCMP - Science and Research",
    enabled: true,
  },
  {
    url: "https://www.scmp.com/rss/318222/feed",
    name: "SCMP Innovation",
    category: "innovation",
    description: "SCMP - Innovation",
    enabled: true,
  },
  {
    url: "https://www.wired.com/feed/category/backchannel/latest/rss",
    name: "WIRED Backchannel",
    category: "culture",
    description: "WIRED - Technology and Culture",
    enabled: true,
  },
  {
    url: "https://www.wired.com/feed/rss",
    name: "WIRED",
    category: "tech-culture",
    description: "Technology, science, and digital culture",
    enabled: true,
  },
];

export const techPrompts = {
  articleSummary: `Summarize the key points of this news article objectively in 2-4 sentences. Identify the main topics covered.

Article:
{article_content}`,

  impactRating: `Analyze the following article summary and estimate its overall impact. Consider factors like newsworthiness, originality, geographic scope (local vs global), number of people affected, severity, and potential long-term consequences. Be extremely critical and conservative when assigning scores—higher scores should reflect truly exceptional or rare events.

Rate the impact on a scale of 1 to 10, using these guidelines:

1-2: Minimal significance. Niche interest or local news with no broader relevance. Example: A review of a local restaurant or a minor product launch.

3-4: Regionally notable. Pop culture happenings, local events, or community-focused stories. Example: A local mayor's resignation or a regional festival.

5-6: Regionally significant or moderately global. Affects multiple communities or industries. Example: A nationwide strike or a major company bankruptcy.

7-8: Highly significant. Major international relevance, significant disruptions, or wide-reaching implications. Example: A large-scale natural disaster, global health alerts, or a major geopolitical shift.

9-10: Extraordinary and historic. Global, severe, and long-lasting implications. Example: Declaration of war, groundbreaking global treaties, or critical climate crises.

Key Reminder: Scores of 9-10 should be exceedingly rare and reserved for world-defining events. Always err on the side of a lower score unless the impact is undeniably significant.

Summary:
"{summary}"

Output ONLY the integer number representing your rating (1-10).`,

  briefSynthesis: `You are an AI assistant writing a daily intelligence briefing for a tech and politics youtuber using Markdown. The quality of this briefing is vital for the development of the channel. Synthesize the following analyzed news clusters into a coherent, high-level executive summary. Start with the 2-3 most critical overarching themes globally based *only* on these inputs. Then, provide concise bullet points summarizing key developments within the most significant clusters (roughly 7-10 clusters) and a paragraph summarizing connections and conclusions between the points. Maintain an objective, analytical tone. Avoid speculation. Try to include the sources of each statement using a numbered reference style using Markdown link syntax. The link should reference the article title and NOT the news cluster, and link to the article link which is available right after it's summary. It's vital to understand the source of the information for later analysis.

Analyzed News Clusters (Most significant first):
{cluster_analyses_text}`,
};

export const techFeedConfig: FeedConfiguration = {
  profile: 'technology',
  rssFeeds: techRSSFeeds,
  prompts: techPrompts,
  settings: {
    priority: 1,
    enabled: true,
  },
};

// Export individual parts for convenience
export { techPrompts as prompts, techRSSFeeds as rssFeeds };

const getFeedsByCategory = (category: string): RSSFeed[] => {
  return techRSSFeeds.filter(feed => feed.category === category);
};

const getEnabledFeeds = (): RSSFeed[] => {
  return techRSSFeeds.filter(feed => feed.enabled !== false);
};

const getFeedCategories = (): string[] => {
  const categories = new Set(
    techRSSFeeds
      .map(feed => feed.category)
      .filter((category): category is string => category !== undefined)
  );

  return Array.from(categories);
};

export const getTechFeedStats = () => {
  const totalFeeds = techRSSFeeds.length;
  const enabledFeeds = getEnabledFeeds().length;
  const categories = getFeedCategories();

  const categoryStats = categories.reduce((stats, category) => {
    stats[category] = getFeedsByCategory(category).length;
    return stats;
  }, {} as Record<string, number>);

  return {
    totalFeeds,
    enabledFeeds,
    disabledFeeds: totalFeeds - enabledFeeds,
    categories: categories.length,
    categoryBreakdown: categoryStats,
  };
};
