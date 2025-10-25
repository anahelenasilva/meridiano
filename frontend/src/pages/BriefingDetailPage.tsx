import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Calendar, Tag } from 'lucide-react';
import moment from 'moment';
import { Link, useParams } from 'react-router-dom';

import { apiService } from '../services/api';
import type { BriefingDetailResponse } from '../types/api';

const BriefingDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const briefingId = parseInt(id || '0');

  const { data, isLoading, error } = useQuery<BriefingDetailResponse>({
    queryKey: ['briefing', briefingId],
    queryFn: async () => {
      const response = await apiService.getBriefing(briefingId);
      return response.data;
    },
    enabled: !isNaN(briefingId),
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
        <div className="text-red-600 text-lg mb-4">Error loading briefing</div>
        <Link
          to="/"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Back to Briefings
        </Link>
      </div>
    );
  }

  const { brief } = data;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center space-x-4">
        <Link
          to="/"
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Briefings</span>
        </Link>
        <Link
          to={`/articles?feed_profile=${brief.feed_profile}`}
          className="text-blue-600 hover:text-blue-800 transition-colors"
        >
          View related articles
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
          {brief.feed_profile}
        </h1>

        <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>{moment(brief.generated_at).format('MMMM D, YYYY [at] h:mm A')}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Tag className="h-4 w-4" />
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
              {brief.feed_profile}
            </span>
          </div>
        </div>

        {brief.brief_markdown && (
          <div className="text-lg text-gray-700 leading-relaxed mb-6 p-6 bg-blue-50 rounded-lg border-l-4 border-blue-500">
            <div className="font-medium text-blue-900 mb-2">Executive Summary</div>
            {/* {brief.brief_markdown} */}

            TO-DO
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Full Briefing</h2>
        <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
          {brief.brief_markdown.split('\n').map((paragraph, index) => (
            paragraph.trim() && (
              <p key={index} className="mb-4">
                {paragraph}
              </p>
            )
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            to={`/articles?feed_profile=${brief.feed_profile}`}
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            View Related Articles
          </Link>
          <Link
            to={`/?feed_profile=${brief.feed_profile}`}
            className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            More Briefings from {brief.feed_profile}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BriefingDetailPage;
