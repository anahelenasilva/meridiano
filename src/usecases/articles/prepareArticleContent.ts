import { marked } from 'marked';

export function prepareArticleContent(article: any) {
  return {
    ...article,
    processed_content_html: article.processed_content ? marked.parse(article.processed_content) : null,
    content_html: article.content ? marked.parse(article.content) : null
  };
}
