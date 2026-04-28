import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchPublishedArticles } from '../api/articles';
import { ArticleListQuery } from '../types/articles';

function formatDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function ArticlesPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);

  // Simple debounce via timeout ref
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    const val = e.target.value;
    setTimeout(() => {
      setDebouncedSearch(val);
      setPage(1);
    }, 400);
  };

  const query: ArticleListQuery = {
    page,
    pageSize: 12,
    search: debouncedSearch || undefined,
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['articles', 'public', query],
    queryFn: () => fetchPublishedArticles(query),
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Articles & Resources</h1>
          <p className="text-gray-500 mt-1">
            Expert articles about migraine management and relief strategies.
          </p>
        </div>

        <input
          type="search"
          value={search}
          onChange={handleSearchChange}
          placeholder="Search articles…"
          className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
        />
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
              <div className="h-5 bg-gray-200 rounded mb-3 w-3/4" />
              <div className="h-3 bg-gray-100 rounded mb-1 w-full" />
              <div className="h-3 bg-gray-100 rounded w-5/6" />
            </div>
          ))}
        </div>
      )}

      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          Failed to load articles: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      )}

      {data && data.items.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No articles found.</p>
          {debouncedSearch && (
            <button
              onClick={() => { setSearch(''); setDebouncedSearch(''); }}
              className="mt-2 text-blue-600 hover:underline text-sm"
            >
              Clear search
            </button>
          )}
        </div>
      )}

      {data && data.items.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.items.map((article) => (
              <Link
                key={article.id}
                to={`/articles/${article.slug}`}
                className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md hover:border-blue-200 transition-all"
              >
                <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600" />
                <div className="p-6">
                  <h3 className="font-semibold text-gray-900 text-base mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {article.title}
                  </h3>
                  {article.excerpt && (
                    <p className="text-gray-500 text-sm leading-relaxed line-clamp-3 mb-4">
                      {article.excerpt}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span className="font-medium text-gray-600">{article.author.fullName}</span>
                    <span>{formatDate(article.publishedAt)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                ← Prev
              </button>
              <span className="text-sm text-gray-600">
                Page {page} of {data.pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                disabled={page === data.pagination.totalPages}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
