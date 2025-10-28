import { useQuery } from '@tanstack/react-query';
import { Calendar, ExternalLink, Eye, Search } from 'lucide-react';
import moment from 'moment';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiService } from '../services/api';
import type { ArticlesResponse } from '../types/api';

const ArticlesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL state management
  const [filters, setFilters] = useState({
    page: parseInt(searchParams.get('page') || '1'),
    sort_by: searchParams.get('sort_by') || 'published_date',
    direction: (searchParams.get('direction') || 'desc') as 'asc' | 'desc',
    feed_profile: searchParams.get('feed_profile') || '',
    search: searchParams.get('search') || '',
    start_date: searchParams.get('start_date') || '',
    end_date: searchParams.get('end_date') || '',
    preset: searchParams.get('preset') || '',
    category: searchParams.get('category') || '',
  });

  // Local search input state for debouncing
  const [searchInput, setSearchInput] = useState(filters.search);
  const debounceTimeout = useRef<number>();

  const updateFilter = useCallback((key: string, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      ...(key !== 'page' && { page: 1 }) // Reset to page 1 when other filters change
    }));
  }, []);

  // Debounced search effect
  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      if (searchInput !== filters.search) {
        updateFilter('search', searchInput);
      }
    }, 500); // 500ms delay

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [searchInput, filters.search, updateFilter]);

  // Update URL when filters change (except for search input changes)
  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value.toString());
    });
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  const { data, isLoading, error } = useQuery<ArticlesResponse>({
    queryKey: ['articles', filters],
    cacheTime: 0,
    queryFn: async () => {
      const response = await apiService.getArticles(filters);
      return response.data;
    },
  });

  const handlePresetDate = (preset: string) => {
    updateFilter('preset', preset);
    // Clear individual date filters when using preset
    setFilters(prev => ({ ...prev, start_date: '', end_date: '', preset }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-lg mb-4">Error loading articles</div>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const { articles, pagination, available_profiles, available_categories } = data || {
    articles: [],
    pagination: { page: 1, per_page: 20, total_pages: 0, total_articles: 0 },
    available_profiles: [],
    available_categories: []
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Articles
            {filters.feed_profile && (
              <span className="ml-3 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {filters.feed_profile}
              </span>
            )}
            {filters.category && (
              <span className="ml-3 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                {filters.category}
              </span>
            )}
          </h1>
          {pagination.total_articles > 0 && (
            <p className="text-gray-600">
              Showing {(pagination.page - 1) * pagination.per_page + 1} - {Math.min(pagination.page * pagination.per_page, pagination.total_articles)} of {pagination.total_articles} articles
            </p>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        {/* Search and Profile */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                  }
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <select
              value={filters.feed_profile}
              onChange={(e) => updateFilter('feed_profile', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Profiles</option>
              {available_profiles.map((profile) => (
                <option key={profile} value={profile}>
                  {profile}
                </option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={filters.category}
              onChange={(e) => updateFilter('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {available_categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date Filters */}
        <div className="space-y-3">
          <div className="flex items-center space-x-4">
            <Calendar className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Date Range:</span>
            <div className="flex space-x-2">
              {['yesterday', 'last_week', 'last_30d', 'last_3m'].map((preset) => (
                <button
                  key={preset}
                  onClick={() => handlePresetDate(preset)}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${filters.preset === preset
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  {preset.replace('_', ' ').replace('last ', 'Last ')}
                </button>
              ))}
            </div>
          </div>
          <div className="flex space-x-4">
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => updateFilter('start_date', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => updateFilter('end_date', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Sorting */}
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">Sort by:</span>
          <select
            value={filters.sort_by}
            onChange={(e) => updateFilter('sort_by', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="published_date">Date</option>
            <option value="title">Title</option>
            <option value="impact_rating">Impact Rating</option>
          </select>
          <select
            value={filters.direction}
            onChange={(e) => updateFilter('direction', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      </div>

      {/* Articles Grid */}
      {articles.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">No articles found</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {articles.map((article) => (
            <div
              key={article.id}
              className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
            >
              {article.image_url && (
                <div className="h-48 overflow-hidden">
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

              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <Link
                      to={`/article/${article.id}`}
                      className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-2"
                    >
                      {article.title}
                    </Link>
                  </div>
                </div>

                <div className="flex items-center space-x-4 mb-3 text-sm text-gray-600">
                  <span>{moment(article.published_date).format('MMM D, YYYY')}</span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                    {article.feed_profile}
                  </span>
                  {article.impact_rating && (
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${article.impact_rating >= 8 ? 'bg-red-100 text-red-800' :
                      article.impact_rating >= 6 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                      Impact: {article.impact_rating}/10
                    </span>
                  )}
                  {article.categories && article.categories.length > 0 && (
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs bg-cyan-200 text-cyan-800`}>
                      Categories: {article.categories.join(', ')}
                    </span>
                  )}
                </div>

                {article.processed_content && (
                  <div className="text-gray-700 text-sm mb-4 line-clamp-3">
                    {article.processed_content}
                  </div>
                )}

                <div className="flex items-center space-x-3">
                  <Link
                    to={`/article/${article.id}`}
                    className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    <span>Read More</span>
                  </Link>
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>Original</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          {pagination.page > 1 && (
            <button
              onClick={() => updateFilter('page', pagination.page - 1)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Previous
            </button>
          )}

          <span className="px-4 py-2 text-gray-700">
            Page {pagination.page} of {pagination.total_pages}
          </span>

          {pagination.page < pagination.total_pages && (
            <button
              onClick={() => updateFilter('page', pagination.page + 1)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Next
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ArticlesPage;
