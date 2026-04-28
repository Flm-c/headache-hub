import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchArticleBySlug,
  fetchArticleComments,
  createComment,
  deleteComment,
} from '../api/articles';
import { useAuth } from '../hooks/useAuth';

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState('');

  const {
    data: article,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['article', slug],
    queryFn: () => fetchArticleBySlug(slug!),
    enabled: !!slug,
  });

  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ['article-comments', article?.id],
    queryFn: () => fetchArticleComments(article!.id),
    enabled: !!article?.commentsEnabled && !!article?.id,
  });

  const submitCommentMutation = useMutation({
    mutationFn: (content: string) => createComment(article!.id, content),
    onSuccess: () => {
      setCommentText('');
      queryClient.invalidateQueries({ queryKey: ['article-comments', article?.id] });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: ({ commentId }: { commentId: string }) =>
      deleteComment(article!.id, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['article-comments', article?.id] });
    },
  });

  const canEdit =
    isAuthenticated &&
    article &&
    (user?.role === 'ADMIN' ||
      (user?.role === 'EDITOR' && article.author.id === user.id));

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto py-8 animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-2/3" />
        <div className="h-4 bg-gray-100 rounded w-1/3" />
        <div className="space-y-2 mt-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-4 bg-gray-100 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">
          <p className="font-semibold">Failed to load article</p>
          <p className="text-sm mt-1">{error instanceof Error ? error.message : 'Unknown error'}</p>
          <button
            onClick={() => navigate('/articles')}
            className="mt-4 text-sm text-red-600 hover:underline"
          >
            ← Back to articles
          </button>
        </div>
      </div>
    );
  }

  if (!article) return null;

  return (
    <div className="max-w-3xl mx-auto py-8">
      {/* Back link */}
      <Link
        to="/articles"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-8 transition-colors"
      >
        ← All articles
      </Link>

      {/* Article header */}
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 leading-tight mb-4">
          {article.title}
        </h1>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="font-medium text-gray-700">{article.author.fullName}</span>
            <span>·</span>
            <span>{formatDate(article.publishedAt)}</span>
          </div>

          {canEdit && (
            <Link
              to={`/articles/${article.id}/edit`}
              className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition-colors"
            >
              Edit article
            </Link>
          )}
        </div>
      </header>

      {/* Article content — rendered HTML from Tiptap */}
      <div
        className="article-body"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />

      {/* Comments */}
      {article.commentsEnabled && (
        <section className="mt-16 border-t border-gray-200 pt-10">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Comments
            {comments.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-400">
                ({comments.filter((c) => !c.isDeleted).length})
              </span>
            )}
          </h2>

          {/* Comment form */}
          {isAuthenticated && user?.isApproved ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (commentText.trim()) {
                  submitCommentMutation.mutate(commentText.trim());
                }
              }}
              className="mb-8"
            >
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Share your thoughts…"
                rows={3}
                maxLength={2000}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-400">
                  {commentText.length}/2000
                </span>
                <button
                  type="submit"
                  disabled={!commentText.trim() || submitCommentMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50 transition-colors"
                >
                  {submitCommentMutation.isPending ? 'Posting…' : 'Post comment'}
                </button>
              </div>
              {submitCommentMutation.isError && (
                <p className="text-red-600 text-sm mt-2">
                  {submitCommentMutation.error instanceof Error
                    ? submitCommentMutation.error.message
                    : 'Failed to post comment'}
                </p>
              )}
            </form>
          ) : isAuthenticated && !user?.isApproved ? (
            <p className="text-sm text-gray-500 mb-6">
              Your account needs to be approved before you can comment.
            </p>
          ) : (
            <p className="text-sm text-gray-500 mb-6">
              <Link to="/login" className="text-blue-600 hover:underline">
                Sign in
              </Link>{' '}
              to leave a comment.
            </p>
          )}

          {/* Comment list */}
          {commentsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse flex gap-3">
                  <div className="h-8 w-8 bg-gray-200 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-1/4" />
                    <div className="h-3 bg-gray-100 rounded w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <ul className="space-y-6">
              {comments.map((comment) =>
                comment.isDeleted ? (
                  <li key={comment.id} className="text-sm text-gray-400 italic">
                    [Comment deleted]
                  </li>
                ) : (
                  <li key={comment.id} className="flex gap-3">
                    <div className="h-8 w-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-medium shrink-0">
                      {comment.user.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-semibold text-gray-800">
                          {comment.user.fullName}
                        </span>
                        <span className="text-xs text-gray-400">{formatDate(comment.createdAt)}</span>
                      </div>
                      <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">
                        {comment.content}
                      </p>

                      {isAuthenticated &&
                        (user?.id === comment.user.id || user?.role === 'ADMIN') && (
                          <button
                            onClick={() =>
                              deleteCommentMutation.mutate({ commentId: comment.id })
                            }
                            className="text-xs text-red-500 hover:text-red-700 mt-1 transition-colors"
                          >
                            Delete
                          </button>
                        )}
                    </div>
                  </li>
                )
              )}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
