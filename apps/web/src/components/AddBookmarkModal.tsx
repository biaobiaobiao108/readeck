import React, { useState, useEffect } from 'react';
import { X, Loader2, Link as LinkIcon, Tag as TagIcon } from 'lucide-react';
import type { CreateBookmarkDTO, Tag } from '@readeck/shared';

interface AddBookmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dto: CreateBookmarkDTO) => Promise<void>;
  existingTags?: Tag[];
}

export const AddBookmarkModal: React.FC<AddBookmarkModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  existingTags = [],
}) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isStarred, setIsStarred] = useState(false);
  const [isArchived, setIsArchived] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const normalizeUrl = (input: string): string => {
    let trimmed = input.trim();
    if (trimmed && !/^https?:\/\//i.test(trimmed)) {
      trimmed = `https://${trimmed}`;
    }
    return trimmed;
  };

  const handleTagToggle = (tagName: string) => {
    const currentTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const lowerName = tagName.toLowerCase();
    let newTags: string[];
    if (currentTags.some((t) => t.toLowerCase() === lowerName)) {
      newTags = currentTags.filter((t) => t.toLowerCase() !== lowerName);
    } else {
      newTags = [...currentTags, tagName];
    }
    setTagsInput(newTags.join(', '));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalUrl = normalizeUrl(url);
    if (!finalUrl) return;

    setIsLoading(true);
    setError(null);

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      await onSubmit({
        url: finalUrl,
        title: title.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
        is_starred: isStarred,
        is_archived: isArchived,
      });
      setUrl('');
      setTitle('');
      setTagsInput('');
      setIsStarred(false);
      setIsArchived(false);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save bookmark');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <h2 className="font-semibold text-lg text-neutral-900 dark:text-neutral-100">
              Save New Bookmark
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
              Webpage URL <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onBlur={() => {
                if (url.trim()) setUrl(normalizeUrl(url));
              }}
              placeholder="https://example.com/great-article or example.com"
              disabled={isLoading}
              className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500 text-neutral-900 dark:text-neutral-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">
              Title Override (Optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Leave blank to automatically extract title"
              disabled={isLoading}
              className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500 text-neutral-900 dark:text-neutral-100"
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
              placeholder="tech, ai, tutorial"
              disabled={isLoading}
              className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500 text-neutral-900 dark:text-neutral-100"
            />
            {existingTags.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-neutral-400 mr-1 flex items-center gap-1">
                  <TagIcon className="w-3 h-3" /> Quick add:
                </span>
                {existingTags.slice(0, 8).map((tag) => {
                  const isSelected = tagsInput
                    .split(',')
                    .map((t) => t.trim().toLowerCase())
                    .includes(tag.name.toLowerCase());
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => handleTagToggle(tag.name)}
                      className={`text-[11px] px-2 py-0.5 rounded-full font-medium transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-teal-600 text-white dark:bg-teal-500'
                          : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300'
                      }`}
                    >
                      +{tag.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center gap-6 pt-1">
            <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isStarred}
                onChange={(e) => setIsStarred(e.target.checked)}
                disabled={isLoading}
                className="rounded text-teal-600 focus:ring-teal-500"
              />
              <span>Star as Favorite</span>
            </label>

            <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isArchived}
                onChange={(e) => setIsArchived(e.target.checked)}
                disabled={isLoading}
                className="rounded text-teal-600 focus:ring-teal-500"
              />
              <span>Save to Archive</span>
            </label>
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
              <span>{isLoading ? 'Extracting & Saving...' : 'Save'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
