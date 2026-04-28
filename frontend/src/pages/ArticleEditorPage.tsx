import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import TiptapEditor from '../components/TiptapEditor';
import {
  createArticle,
  fetchMyArticleById,
  publishArticle,
  unpublishArticle,
  updateArticle,
} from '../api/articles';
import { useAuth } from '../hooks/useAuth';
import { ArticleStatus } from '../types/articles';

// Strip HTML tags for excerpt auto-generation
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160);
}

export default function ArticleEditorPage() {
  const { id } = useParams<{ id?: string }>();
  const isEditing = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [commentsEnabled, setCommentsEnabled] = useState(false);
  const [status, setStatus] = useState<ArticleStatus>('DRAFT');
  const [articleId, setArticleId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  // Load existing article when editing
  const { data: existingArticle, isLoading: loadingArticle, isError: fetchFailed } = useQuery({
    queryKey: ['my-article', id],
    queryFn: () => fetchMyArticleById(id!),
    enabled: isEditing,
    retry: false,
  });

  useEffect(() => {
    if (existingArticle) {
      setTitle(existingArticle.title);
      setContent(existingArticle.content);
      setExcerpt(existingArticle.excerpt ?? '');
      setCommentsEnabled(existingArticle.commentsEnabled);
      setStatus(existingArticle.status);
      setArticleId(existingArticle.id);
    }
  }, [existingArticle]);

  // Save (create or update)
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: title.trim(),
        content,
        excerpt: excerpt.trim() || stripHtml(content) || null,
        commentsEnabled,
      };

      if (articleId) {
        return updateArticle(articleId, payload);
      } else {
        return createArticle(payload);
      }
    },
    onSuccess: (saved) => {
      if (!articleId) {
        setArticleId(saved.id);
        // Redirect to edit URL so the page knows it has an ID
        navigate(`/articles/${saved.id}/edit`, { replace: true });
      }
      setStatus(saved.status);
      setIsDirty(false);
      setSaveError('');
      queryClient.invalidateQueries({ queryKey: ['my-articles'] });
    },
    onError: (err) => {
      setSaveError(err instanceof Error ? err.message : 'Failed to save');
    },
  });

  // Publish
  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!articleId) return;
      return publishArticle(articleId);
    },
    onSuccess: (saved) => {
      if (saved) setStatus(saved.status);
      queryClient.invalidateQueries({ queryKey: ['my-articles'] });
    },
    onError: (err) => {
      setSaveError(err instanceof Error ? err.message : 'Failed to publish');
    },
  });

  // Unpublish
  const unpublishMutation = useMutation({
    mutationFn: async () => {
      if (!articleId) return;
      return unpublishArticle(articleId);
    },
    onSuccess: (saved) => {
      if (saved) setStatus(saved.status);
      queryClient.invalidateQueries({ queryKey: ['my-articles'] });
    },
    onError: (err) => {
      setSaveError(err instanceof Error ? err.message : 'Failed to unpublish');
    },
  });

  const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTitle(e.target.value);
    setIsDirty(true);
  };

  const handleContentChange = (html: string) => {
    setContent(html);
    setIsDirty(true);
  };

  const handleSave = () => {
    if (!title.trim()) {
      setSaveError('Title is required');
      return;
    }
    saveMutation.mutate();
  };

  if (isEditing && loadingArticle) {
    return (
      <div className="max-w-3xl mx-auto py-16 animate-pulse space-y-6">
        <div className="h-10 bg-gray-200 rounded w-2/3" />
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-4 bg-gray-100 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (isEditing && fetchFailed) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
          <p className="font-semibold">Failed to load article</p>
          <p className="text-sm mt-1">The article was not found or you don't have permission to edit it.</p>
          <Link to="/dashboard/my-articles" className="mt-4 inline-block text-sm text-red-600 hover:underline">
            ← Back to my articles
          </Link>
        </div>
      </div>
    );
  }

  const isSaving = saveMutation.isPending;
  const isPublishing = publishMutation.isPending || unpublishMutation.isPending;
  const canPublish = !!articleId && !isDirty && !!title.trim() && !!content.trim();

  return (
    <div className="max-w-3xl mx-auto py-8">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <Link
          to="/dashboard/my-articles"
          className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          ← My articles
        </Link>

        <div className="flex items-center gap-2">
          {/* Status badge */}
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              status === 'PUBLISHED'
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {status}
          </span>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={isSaving || !isDirty}
            className="text-sm bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg disabled:opacity-40 transition-colors"
          >
            {isSaving ? 'Saving…' : isDirty ? 'Save draft' : 'Saved'}
          </button>

          {/* Publish / Unpublish */}
          {status === 'PUBLISHED' ? (
            <button
              onClick={() => unpublishMutation.mutate()}
              disabled={isPublishing}
              className="text-sm bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg disabled:opacity-50 transition-colors"
            >
              {isPublishing ? 'Unpublishing…' : 'Unpublish'}
            </button>
          ) : (
            <button
              onClick={() => {
                if (!canPublish) {
                  if (isDirty) {
                    setSaveError('Save your changes before publishing');
                  } else if (!content.trim()) {
                    setSaveError('Add some content before publishing');
                  }
                  return;
                }
                publishMutation.mutate();
              }}
              disabled={isPublishing || !articleId}
              title={
                isDirty
                  ? 'Save changes first'
                  : !content.trim()
                  ? 'Add content first'
                  : 'Publish article'
              }
              className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 transition-colors"
            >
              {isPublishing ? 'Publishing…' : 'Publish'}
            </button>
          )}
        </div>
      </div>

      {saveError && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 mb-6">
          {saveError}
          <button
            className="ml-2 underline text-red-500"
            onClick={() => setSaveError('')}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Title — Telegraph-style large textarea */}
      <textarea
        value={title}
        onChange={handleTitleChange}
        placeholder="Title"
        rows={2}
        maxLength={240}
        className="w-full text-4xl font-bold text-gray-900 placeholder-gray-300 bg-transparent border-none outline-none resize-none leading-tight mb-6"
      />

      {/* Tiptap editor.
           Key = articleId (state): starts as null ('new') → after loading sets to UUID.
           Key change forces remount → Tiptap initialises with the loaded content.
           For new articles key stays 'new' throughout. */}
      <TiptapEditor
        key={articleId ?? 'new'}
        content={content}
        onChange={handleContentChange}
        placeholder="Tell your story…"
      />

      {/* Separator */}
      <div className="mt-12 border-t border-gray-200 pt-6 space-y-4">
        {/* Excerpt */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Excerpt{' '}
            <span className="text-gray-400 font-normal">(optional — auto-generated if empty)</span>
          </label>
          <textarea
            value={excerpt}
            onChange={(e) => { setExcerpt(e.target.value); setIsDirty(true); }}
            placeholder="Short description for the article card…"
            rows={2}
            maxLength={500}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Comments toggle */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={commentsEnabled}
            onChange={(e) => { setCommentsEnabled(e.target.checked); setIsDirty(true); }}
            className="w-4 h-4 rounded accent-blue-600"
          />
          <span className="text-sm text-gray-700">Enable comments on this article</span>
        </label>

        {/* Author info */}
        <p className="text-xs text-gray-400">
          Writing as <span className="font-medium text-gray-600">{user?.fullName}</span>
        </p>
      </div>
    </div>
  );
}
