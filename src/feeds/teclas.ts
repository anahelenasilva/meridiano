import { FeedConfiguration, RSSFeed } from '../types/feed';

export const teclasRSSFeeds: RSSFeed[] = [
  {
    url: "https://www.tecnologiaeclasse.com.br/feed",
    name: "Teclas",
    category: "blog",
    description: "TeClas é um canal (e agora também uma newsletter) sobre tecnologia e luta de classes.",
    enabled: true,
  },
  {
    url: "https://teclas.soberana.tv/rss.xml",
    name: "Roteiros Tecnologia e Classe",
    category: "news",
    description: "eed dos roteiros de vídeos do canal Tecnologia e Classe",
    enabled: true,
  },
];

const pt_br = " Responda em português brasileiro.";

export const teclasPrompts = {
  articleSummary: `Resuma os pontos principais desta notícia objetivamente em 2 a 4 frases. Identifique os principais tópicos abordados.

Artigo:
{article_content}.${pt_br}`,

  impactRating: `""Analise o resumo da notícia a seguir e estime seu impacto no contexto brasileiro. Considere fatores como noticiabilidade, relevância para o público brasileiro, abrangência geográfica (local, regional ou nacional), número de pessoas afetadas, gravidade e potenciais consequências a longo prazo para o Brasil. Seja extremamente crítico e conservador ao atribuir pontuações — pontuações mais altas devem refletir eventos verdadeiramente excepcionais ou raros dentro da realidade brasileira.

Avalie o impacto em uma escala de 1 a 10, usando estas diretrizes:

1-2: Significância mínima. Interesse de nicho ou notícias locais sem relevância mais ampla. Exemplo: Um evento cultural local ou a abertura de um pequeno comércio.

3-4: Notável regionalmente. Acontecimentos de relevância em um estado ou região específica. Exemplo: Mudanças na administração de uma cidade importante ou eventos regionais de grande participação.

5-6: Significativo nacionalmente. Afeta múltiplos estados ou tem relevância nacional moderada. Exemplo: Greves de categorias importantes ou mudanças significativas em políticas públicas regionais.

7-8: Altamente significativo no Brasil. Grande relevância nacional, interrupções significativas ou implicações de longo alcance. Exemplo: Um desastre natural em grande escala, crises políticas de grande impacto ou escândalos nacionais.

9-10: Extraordinário e histórico no contexto brasileiro. Implicações nacionais graves e duradouras. Exemplo: Mudanças constitucionais marcantes, crises econômicas severas ou eventos históricos que redefinem o país.

Lembrete importante: Pontuações de 9 a 10 devem ser extremamente raras e reservadas para eventos que definem o Brasil. Sempre opte por uma pontuação menor, a menos que o impacto seja inegavelmente significativo.

Resumo:
"{summary}"

Digite SOMENTE o número inteiro que representa sua classificação (1 a 10).
""`,

  briefSynthesis: `"""
Você é um assistente de IA escrevendo um briefing diário de inteligência no estilo presidencial usando Markdown, especificamente para a categoria '{feed_profile}'.
Sintetize os seguintes grupos de notícias analisados em um resumo executivo coerente e de alto nível que será apresentado em formato Markdown.

Comece com os 4 ou 5 temas abrangentes mais críticos em relação ao Brasil ou dentro desta categoria, com base *apenas* nestas informações.

Em seguida, forneça tópicos concisos resumindo os principais desenvolvimentos dentro dos grupos mais significativos (aproximadamente 5 a 7 grupos).
Mantenha um tom objetivo e analítico relevante para o contexto '{feed_profile}'. Evite especulações.

Tente incluir as fontes de cada declaração usando um estilo de referência numerado, utilizando a sintaxe de link Markdown. O link deve fazer referência ao título do artigo, NÃO ao cluster de notícias, e direcionar para o link do artigo, disponível logo após o resumo. É fundamental entender a fonte da informação para análise posterior.

Grupos de Notícias Analisados (Mais significativos primeiro):
{cluster_analyses_text}
"""`,

  clusterAnalyses: `"""
Estes são resumos de artigos de notícias potencialmente relacionados de um contexto '{feed_profile}':

{cluster_summaries_text}

Qual é o evento ou tópico principal discutido? Resuma os principais desenvolvimentos e a importância em 3 a 5 frases, com base *apenas* no texto fornecido. Se os artigos parecerem não relacionados, informe isso claramente.
""".${pt_br}`,
};

export const teclasFeedConfig: FeedConfiguration = {
  profile: 'teclas',
  rssFeeds: teclasRSSFeeds,
  prompts: teclasPrompts,
  settings: {
    priority: 2,
    enabled: true,
  },
};

// Export individual parts for convenience
export { teclasPrompts as prompts, teclasRSSFeeds as rssFeeds };

const getFeedsByCategory = (category: string): RSSFeed[] => {
  return teclasRSSFeeds.filter(feed => feed.category === category);
};

const getEnabledFeeds = (): RSSFeed[] => {
  return teclasRSSFeeds.filter(feed => feed.enabled !== false);
};

const getFeedCategories = (): string[] => {
  const categories = new Set(
    teclasRSSFeeds
      .map(feed => feed.category)
      .filter((category): category is string => category !== undefined)
  );

  return Array.from(categories);
};

export const getTeclasFeedStats = () => {
  const totalFeeds = teclasRSSFeeds.length;
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
