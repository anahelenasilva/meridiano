import axios from 'axios';

const API_BASE_URL = '/api'; // Use relative URL for Vite proxy

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const apiService = {
  getBriefings: (feedProfile?: string) =>
    api.get(`/briefings${feedProfile ? `?feed_profile=${feedProfile}` : ''}`),

  getBriefing: (id: number) =>
    api.get(`/briefings/${id}`),

  getArticles: (params?: {
    page?: number;
    sort_by?: string;
    direction?: 'asc' | 'desc';
    feed_profile?: string;
    search?: string;
    start_date?: string;
    end_date?: string;
    preset?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.append(key, value.toString());
      });
    }
    return api.get(`/articles?${searchParams.toString()}`);
  },

  getArticle: (id: number) =>
    api.get(`/articles/${id}`),

  getProfiles: () =>
    api.get('/profiles'),

  getHealth: () =>
    api.get('/health'),
};
