import React, { useState, useEffect } from 'react';
import { X, Loader2, Edit3 } from 'lucide-react';
import type { Bookmark, UpdateBookmarkDTO } from '@readeck/shared';

interface EditBookmarkModalProps {
  bookmark: Bookmark | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: number, dto: UpdateBookmarkDTO) => Promise<void>;
}

export const EditBookmarkModal: React.FC<EditBookmarkModalProps> = ({
  bookmark,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (bookmark) {
      setTitle(bookmark.title || '');
      setDescription(bookmark.description || '');
      setTagsInput(bookmark.tags ? bookmark.tags.join(', ') : '');
      setError(null);
    }
  }, [bookmark]);

  if (!isOpen || !bookmark) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      await onSubmit(bookmark.id, {
        title: title.trim(),
        description: description.trim(),
        tags,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update bookmark');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <h2 className="font-semibold text-lg text-neutral-900 dark:text-neutral-100">
              Edit Bookmark
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">
              Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isLoading}
              className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500 text-neutral-900 dark:text-neutral-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
              className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500 text-neutral-900 dark:text-neutral-100 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">
              Tags (Comma-separated)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. design, tutorial, bun"
              disabled={isLoading}
              className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500 text-neutral-900 dark:text-neutral-100"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 text-sm font-medium bg-teal-600 hover:bg-teal-700 text-white rounded-lg flex items-center gap-2 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
