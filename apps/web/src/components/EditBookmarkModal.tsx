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
      setError(err instanceof Error ? err.message : '更新文章详情失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal-950/40 backdrop-blur-xs p-4 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-paper-50 dark:bg-charcoal-900 border border-paper-200 dark:border-charcoal-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden font-sans"
      >
        <div className="px-6 py-4 border-b border-paper-200/80 dark:border-charcoal-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-400 flex items-center justify-center">
              <Edit3 className="w-4 h-4" />
            </div>
            <h2 className="font-serif font-bold text-lg text-charcoal-900 dark:text-paper-100">
              编辑文章详情
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 rounded-lg text-charcoal-400 hover:text-charcoal-700 dark:hover:text-paper-200 hover:bg-paper-200/50 dark:hover:bg-charcoal-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-charcoal-700 dark:text-paper-300 mb-1.5">
              文章标题
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isLoading}
              className="w-full px-3.5 py-2.5 rounded-xl border border-paper-300 dark:border-charcoal-700 bg-paper-100/40 dark:bg-charcoal-800/60 text-sm focus:outline-hidden focus:ring-2 focus:ring-brand-500 text-charcoal-900 dark:text-paper-100"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-charcoal-700 dark:text-paper-300 mb-1.5">
              摘要简述
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
              placeholder="文章摘要或个人批注..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-paper-300 dark:border-charcoal-700 bg-paper-100/40 dark:bg-charcoal-800/60 text-sm focus:outline-hidden focus:ring-2 focus:ring-brand-500 text-charcoal-900 dark:text-paper-100 resize-none placeholder:text-charcoal-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-charcoal-700 dark:text-paper-300 mb-1.5">
              文章标签 <span className="text-charcoal-400 font-normal">（逗号分隔）</span>
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              disabled={isLoading}
              placeholder="科技, 随笔, 设计"
              className="w-full px-3.5 py-2.5 rounded-xl border border-paper-300 dark:border-charcoal-700 bg-paper-100/40 dark:bg-charcoal-800/60 text-sm focus:outline-hidden focus:ring-2 focus:ring-brand-500 text-charcoal-900 dark:text-paper-100 placeholder:text-charcoal-400"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-medium rounded-xl text-charcoal-600 dark:text-paper-300 hover:bg-paper-200/60 dark:hover:bg-charcoal-800 transition-colors cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isLoading || !title.trim()}
              className="px-5 py-2 text-xs font-medium rounded-xl bg-charcoal-900 hover:bg-charcoal-800 text-paper-50 dark:bg-paper-100 dark:hover:bg-white dark:text-charcoal-900 shadow-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-40"
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isLoading ? '保存中...' : '保存更改'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
