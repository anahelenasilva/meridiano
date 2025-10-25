import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Calendar, ExternalLink, Tag } from 'lucide-react';
import moment from 'moment';
import { Link, useParams } from 'react-router-dom';

import { apiService } from '../services/api';
import type { ArticleDetailResponse } from '../types/api';

const ArticleDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const articleId = parseInt(id || '0');

  const { data, isLoading, error } = useQuery<ArticleDetailResponse>({
    queryKey: ['article', articleId],
    queryFn: async () => {
      const response = await apiService.getArticle(articleId);
      return response.data;
    },
    enabled: !isNaN(articleId),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-lg mb-4">Error loading article</div>
        <Link
          to="/articles"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Back to Articles
        </Link>
      </div>
    );
  }

  const { article, related_articles } = data;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Navigation */}
      <div className="flex items-center space-x-4">
        <Link
          to="/articles"
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Articles</span>
        </Link>
        <Link
          to={`/articles?feed_profile=${article.feed_profile}`}
          className="text-blue-600 hover:text-blue-800 transition-colors"
        >
          View more from {article.feed_profile}
        </Link>
      </div>

      {/* Article Header */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {article.image_url && (
          <div className="h-64 md:h-96 overflow-hidden">
            <img
              src={article.image_url}
              alt={article.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}

        <div className="p-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
            {article.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>{moment(article.published_date).format('MMMM D, YYYY [at] h:mm A')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Tag className="h-4 w-4" />
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                {article.feed_profile}
              </span>
            </div>
            <div className="text-gray-500">
              Source: {article.feed_source}
            </div>
            {article.impact_rating && (
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${article.impact_rating >= 8 ? 'bg-red-100 text-red-800' :
                article.impact_rating >= 6 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                Impact Rating: {article.impact_rating}/10
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <ExternalLink className="h-5 w-5" />
              <span>Read Original Article</span>
            </a>
          </div>
        </div>
      </div>

      {/* Article Content */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
        {article.processed_content_html && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-blue-600 mb-4">AI Summary</h2>
            <div
              className="prose prose-lg max-w-none text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: article.processed_content_html }}
            />
          </div>
        )}

        {article.content_html && (
          <div>
            <h2 className="text-xl font-semibold text-blue-600 mb-4">Full Content</h2>
            <div
              className="prose prose-lg max-w-none text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: article.content_html }}
            />
          </div>
        )}
      </div>

      {/* Related Articles */}
      {related_articles.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Related Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {related_articles.map((relatedArticle) => (
              <div
                key={relatedArticle.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                {relatedArticle.image_url && (
                  <div className="h-32 overflow-hidden rounded-md mb-3">
                    <img
                      src={relatedArticle.image_url}
                      alt={relatedArticle.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <Link
                  to={`/article/${relatedArticle.id}`}
                  className="text-lg font-medium text-gray-900 hover:text-blue-600 transition-colors line-clamp-2 mb-2"
                >
                  {relatedArticle.title}
                </Link>
                <div className="text-sm text-gray-600 mb-3">
                  {moment(relatedArticle.published_date).format('MMM D, YYYY')} • {relatedArticle.feed_source}
                </div>
                {relatedArticle.processed_content && (
                  <p className="text-sm text-gray-700 line-clamp-3">
                    {relatedArticle.processed_content}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ArticleDetailPage;
