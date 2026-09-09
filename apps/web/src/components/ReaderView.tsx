import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ExternalLink,
  Star,
  Archive,
  ArchiveRestore,
  Type,
  Clock,
  Globe,
  Loader2,
} from 'lucide-react';
import type { Bookmark, BookmarkContent } from '@readeck/shared';
import { api } from '../api/client.ts';

interface ReaderViewProps {
  bookmark: Bookmark;
  onBack: () => void;
  onToggleStar: () => void;
  onToggleArchive: () => void;
}

export const ReaderView: React.FC<ReaderViewProps> = ({
  bookmark,
  onBack,
  onToggleStar,
  onToggleArchive,
}) => {
  const [content, setContent] = useState<BookmarkContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fontSize, setFontSize] = useState<number>(18);
  const [themeMode, setThemeMode] = useState<'light' | 'sepia' | 'dark'>('light');

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    api
      .getBookmarkContent(bookmark.id)
      .then((data) => {
        if (isMounted) setContent(data);
      })
      .catch((err) => {
        console.error('Failed to load content', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [bookmark.id]);

  const bgClasses = {
    light: 'bg-white text-neutral-900',
    sepia: 'bg-[#fbf0d9] text-[#5f4b32]',
    dark: 'bg-[#18181b] text-neutral-100',
  }[themeMode];

  return (
    <div className={`fixed inset-0 z-40 flex flex-col overflow-hidden transition-colors duration-200 ${bgClasses}`}>
      {/* Top Navbar */}
      <header className="h-14 border-b border-neutral-200/60 dark:border-neutral-800/80 px-4 flex items-center justify-between flex-shrink-0 backdrop-blur-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
            title="Back to list"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-semibold text-sm truncate max-w-md hidden sm:inline-block">
            {bookmark.title}
          </span>
        </div>

        {/* Reader controls */}
        <div className="flex items-center gap-2">
          {/* Font size adjustments */}
          <div className="flex items-center bg-black/5 dark:bg-white/10 rounded-lg p-0.5">
            <button
              onClick={() => setFontSize((s) => Math.max(14, s - 2))}
              className="px-2 py-1 text-xs font-bold hover:bg-black/5 dark:hover:bg-white/10 rounded cursor-pointer"
              title="Decrease font size"
            >
              A-
            </button>
            <Type className="w-3.5 h-3.5 mx-1 opacity-50" />
            <button
              onClick={() => setFontSize((s) => Math.min(26, s + 2))}
              className="px-2 py-1 text-xs font-bold hover:bg-black/5 dark:hover:bg-white/10 rounded cursor-pointer"
              title="Increase font size"
            >
              A+
            </button>
          </div>

          {/* Theme switcher */}
          <div className="flex items-center bg-black/5 dark:bg-white/10 rounded-lg p-0.5">
            <button
              onClick={() => setThemeMode('light')}
              className={`w-6 h-6 rounded-full border border-neutral-300 bg-white mx-0.5 cursor-pointer ${
                themeMode === 'light' ? 'ring-2 ring-teal-500' : ''
              }`}
              title="Light"
            />
            <button
              onClick={() => setThemeMode('sepia')}
              className={`w-6 h-6 rounded-full border border-amber-300 bg-[#fbf0d9] mx-0.5 cursor-pointer ${
                themeMode === 'sepia' ? 'ring-2 ring-teal-500' : ''
              }`}
              title="Sepia"
            />
            <button
              onClick={() => setThemeMode('dark')}
              className={`w-6 h-6 rounded-full border border-neutral-700 bg-neutral-900 mx-0.5 cursor-pointer ${
                themeMode === 'dark' ? 'ring-2 ring-teal-500' : ''
              }`}
              title="Dark"
            />
          </div>

          <div className="h-4 w-px bg-neutral-300 dark:bg-neutral-700 mx-1" />

          {/* Favorite */}
          <button
            onClick={onToggleStar}
            className={`p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer ${
              bookmark.is_starred ? 'text-amber-500' : ''
            }`}
            title={bookmark.is_starred ? 'Favorited' : 'Favorite'}
          >
            <Star className={`w-4 h-4 ${bookmark.is_starred ? 'fill-current' : ''}`} />
          </button>

          {/* Archive */}
          <button
            onClick={onToggleArchive}
            className={`p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer ${
              bookmark.is_archived ? 'text-teal-600 dark:text-teal-400' : ''
            }`}
            title={bookmark.is_archived ? 'Archived' : 'Archive'}
          >
            {bookmark.is_archived ? (
              <ArchiveRestore className="w-4 h-4" />
            ) : (
              <Archive className="w-4 h-4" />
            )}
          </button>

          {/* Original link */}
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
            title="Open original webpage"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </header>

      {/* Article Content Area */}
      <main className="flex-1 overflow-y-auto px-4 py-8 sm:py-12">
        <article className="max-w-2xl mx-auto">
          {/* Metadata */}
          <div className="mb-6 space-y-2">
            <div className="flex items-center gap-2 text-xs opacity-60">
              <Globe className="w-3.5 h-3.5" />
              <span>{bookmark.site_name || 'Web'}</span>
              <span>•</span>
              <Clock className="w-3.5 h-3.5" />
              <span>{bookmark.reading_time || 1} min read</span>
              {bookmark.author && (
                <>
                  <span>•</span>
                  <span>By {bookmark.author}</span>
                </>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              {bookmark.title}
            </h1>
          </div>

          {bookmark.thumbnail_url && (
            <div className="mb-8 rounded-xl overflow-hidden shadow-sm">
              <img
                src={bookmark.thumbnail_url}
                alt={bookmark.title}
                className="w-full max-h-[400px] object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-teal-600 gap-3">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="text-sm">Loading article...</span>
            </div>
          ) : content?.html ? (
            <div
              className="reader-content leading-relaxed"
              style={{ fontSize: `${fontSize}px` }}
              dangerouslySetInnerHTML={{ __html: content.html }}
            />
          ) : (
            <div className="py-12 text-center opacity-70 text-sm">
              No reader content extracted. You can view the original article at{' '}
              <a
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-600 underline font-medium"
              >
                {bookmark.url}
              </a>
            </div>
          )}
        </article>
      </main>
    </div>
  );
};
