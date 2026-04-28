import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchMyArticles, deleteArticle, publishArticle, unpublishArticle } from '../api/articles';
import { Article } from '../types/articles';

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function MyArticlesPage() {
  const queryClient = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const { data: articles = [], isLoading, isError, error } = useQuery({
    queryKey: ['my-articles'],
    queryFn: fetchMyArticles,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteArticle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-articles'] });
      setConfirmDelete(null);
    },
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => publishArticle(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-articles'] }),
  });

  const unpublishMutation = useMutation({
    mutationFn: (id: string) => unpublishArticle(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-articles'] }),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Articles</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your drafts and published articles</p>
        </div>
        <Link
          to="/articles/new"
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition-colors"
        >
          + New article
        </Link>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-xl" />
          ))}
        </div>
      )}

      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          {error instanceof Error ? error.message : 'Failed to load articles'}
        </div>
      )}

      {!isLoading && articles.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No articles yet.</p>
          <Link to="/articles/new" className="mt-3 inline-block text-blue-600 hover:underline text-sm">
            Write your first article →
          </Link>
        </div>
      )}

      {articles.length > 0 && (
        <div className="space-y-2">
          {articles.map((article: Article) => (
            <div
              key={article.id}
              className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between gap-4 hover:shadow-sm transition-shadow"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      article.status === 'PUBLISHED'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {article.status}
                  </span>
                  {article.commentsEnabled && (
                    <span className="text-xs text-gray-400">Comments on</span>
                  )}
                </div>
                <p className="font-medium text-gray-900 truncate">{article.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {article.status === 'PUBLISHED'
                    ? `Published ${formatDate(article.publishedAt)}`
                    : `Updated ${formatDate(article.updatedAt)}`}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* View (only published) */}
                {article.status === 'PUBLISHED' && (
                  <Link
                    to={`/articles/${article.slug}`}
                    className="text-xs text-gray-500 hover:text-gray-800 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    View
                  </Link>
                )}

                {/* Edit */}
                <Link
                  to={`/articles/${article.id}/edit`}
                  className="text-xs text-gray-600 hover:text-gray-900 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Edit
                </Link>

                {/* Publish / Unpublish */}
                {article.status === 'DRAFT' ? (
                  <button
                    onClick={() => publishMutation.mutate(article.id)}
                    disabled={publishMutation.isPending}
                    className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-2 py-1.5 rounded-lg transition-colors"
                  >
                    Publish
                  </button>
                ) : (
                  <button
                    onClick={() => unpublishMutation.mutate(article.id)}
                    disabled={unpublishMutation.isPending}
                    className="text-xs bg-gray-50 hover:bg-gray-100 text-gray-600 px-2 py-1.5 rounded-lg transition-colors"
                  >
                    Unpublish
                  </button>
                )}

                {/* Delete */}
                {confirmDelete === article.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => deleteMutation.mutate(article.id)}
                      disabled={deleteMutation.isPending}
                      className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1.5 rounded-lg transition-colors"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1.5"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(article.id)}
                    className="text-xs text-red-400 hover:text-red-600 px-2 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
