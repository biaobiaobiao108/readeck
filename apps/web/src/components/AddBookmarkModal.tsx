import React, { useState, useEffect } from 'react';
import { X, Loader2, Link as LinkIcon, Tag as TagIcon, Star, Archive } from 'lucide-react';
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
      setError(err instanceof Error ? err.message : '保存文章失败，请检查链接');
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
              <LinkIcon className="w-4 h-4" />
            </div>
            <h2 className="font-serif font-bold text-lg text-charcoal-900 dark:text-paper-100">
              添加新文章
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 rounded-lg text-charcoal-400 hover:text-charcoal-700 dark:hover:text-paper-200 hover:bg-paper-200/50 dark:hover:bg-charcoal-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
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
              网页链接 <span className="text-brand-600">*</span>
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
              placeholder="https://example.com/great-article 或直接输入域名"
              disabled={isLoading}
              className="w-full px-3.5 py-2.5 rounded-xl border border-paper-300 dark:border-charcoal-700 bg-paper-100/40 dark:bg-charcoal-800/60 text-sm focus:outline-hidden focus:ring-2 focus:ring-brand-500 text-charcoal-900 dark:text-paper-100 placeholder:text-charcoal-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-charcoal-700 dark:text-paper-300 mb-1.5">
              自定义标题 <span className="text-charcoal-400 font-normal">（留空将自动抓取原文标题）</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="留空自动解析"
              disabled={isLoading}
              className="w-full px-3.5 py-2.5 rounded-xl border border-paper-300 dark:border-charcoal-700 bg-paper-100/40 dark:bg-charcoal-800/60 text-sm focus:outline-hidden focus:ring-2 focus:ring-brand-500 text-charcoal-900 dark:text-paper-100 placeholder:text-charcoal-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-charcoal-700 dark:text-paper-300 mb-1.5">
              文章标签 <span className="text-charcoal-400 font-normal">（多个标签以逗号分隔）</span>
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="科技, 深度阅读, 设计..."
              disabled={isLoading}
              className="w-full px-3.5 py-2.5 rounded-xl border border-paper-300 dark:border-charcoal-700 bg-paper-100/40 dark:bg-charcoal-800/60 text-sm focus:outline-hidden focus:ring-2 focus:ring-brand-500 text-charcoal-900 dark:text-paper-100 placeholder:text-charcoal-400"
            />

            {/* 常用标签快速添加 */}
            {existingTags.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-charcoal-400 mr-1 flex items-center gap-1">
                  <TagIcon className="w-3 h-3" />
                  已有标签:
                </span>
                {existingTags.slice(0, 10).map((t) => {
                  const isSelected = tagsInput
                    .split(',')
                    .map((s) => s.trim().toLowerCase())
                    .includes(t.name.toLowerCase());
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleTagToggle(t.name)}
                      className={`text-[11px] px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-brand-600 text-white font-medium'
                          : 'bg-paper-200/80 hover:bg-paper-300 dark:bg-charcoal-800 dark:hover:bg-charcoal-700 text-charcoal-600 dark:text-paper-300'
                      }`}
                    >
                      #{t.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-2 flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-charcoal-700 dark:text-paper-300">
              <input
                type="checkbox"
                checked={isStarred}
                onChange={(e) => setIsStarred(e.target.checked)}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 accent-amber-600 cursor-pointer"
              />
              <span className="flex items-center gap-1">
                <Star className={`w-3.5 h-3.5 ${isStarred ? 'text-amber-500 fill-amber-500' : 'text-charcoal-400'}`} />
                直接标星收藏
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-charcoal-700 dark:text-paper-300">
              <input
                type="checkbox"
                checked={isArchived}
                onChange={(e) => setIsArchived(e.target.checked)}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 accent-amber-600 cursor-pointer"
              />
              <span className="flex items-center gap-1">
                <Archive className="w-3.5 h-3.5 text-charcoal-400" />
                直接归档
              </span>
            </label>
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
              disabled={isLoading || !url.trim()}
              className="px-5 py-2 text-xs font-medium rounded-xl bg-charcoal-900 hover:bg-charcoal-800 text-paper-50 dark:bg-paper-100 dark:hover:bg-white dark:text-charcoal-900 shadow-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-40"
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isLoading ? '正在解析保存...' : '立即保存'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
