import React from 'react';
import {
  Star,
  Archive,
  ArchiveRestore,
  ExternalLink,
  Trash2,
  Clock,
  Globe,
} from 'lucide-react';
import type { Bookmark } from '@readeck/shared';

interface BookmarkCardProps {
  bookmark: Bookmark;
  onClick: () => void;
  onToggleStar: (e: React.MouseEvent) => void;
  onToggleArchive: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}

export const BookmarkCard: React.FC<BookmarkCardProps> = ({
  bookmark,
  onClick,
  onToggleStar,
  onToggleArchive,
  onDelete,
}) => {
  const formattedDate = new Date(bookmark.created_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

  return (
    <div
      onClick={onClick}
      className="group relative bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden hover:shadow-md hover:border-neutral-300 dark:hover:border-neutral-700 transition-all cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Thumbnail if available */}
        {bookmark.thumbnail_url && (
          <div className="w-full h-44 bg-neutral-100 dark:bg-neutral-800 overflow-hidden relative">
            <img
              src={bookmark.thumbnail_url}
              alt={bookmark.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
        )}

        <div className="p-4">
          {/* Metadata bar */}
          <div className="flex items-center gap-2 text-xs text-neutral-400 dark:text-neutral-500 mb-2">
            <span className="flex items-center gap-1 font-medium truncate max-w-[140px]">
              <Globe className="w-3 h-3 flex-shrink-0" />
              {bookmark.site_name || 'Web'}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {bookmark.reading_time || 1} min read
            </span>
            <span>•</span>
            <span>{formattedDate}</span>
          </div>

          {/* Title */}
          <h2 className="font-semibold text-base text-neutral-900 dark:text-neutral-100 line-clamp-2 mb-1.5 leading-snug group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
            {bookmark.title}
          </h2>

          {/* Description */}
          {bookmark.description && (
            <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed mb-3">
              {bookmark.description}
            </p>
          )}

          {/* Tags */}
          {bookmark.tags && bookmark.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {bookmark.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-block text-[11px] px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div
        className="px-4 py-2.5 bg-neutral-50 dark:bg-neutral-900/60 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-neutral-400"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-1">
          {/* Star toggle */}
          <button
            onClick={onToggleStar}
            title={bookmark.is_starred ? 'Remove favorite' : 'Add to favorites'}
            className={`p-1.5 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer ${
              bookmark.is_starred ? 'text-amber-500 fill-amber-500' : 'hover:text-amber-500'
            }`}
          >
            <Star className={`w-4 h-4 ${bookmark.is_starred ? 'fill-current' : ''}`} />
          </button>

          {/* Archive toggle */}
          <button
            onClick={onToggleArchive}
            title={bookmark.is_archived ? 'Move to unread' : 'Archive bookmark'}
            className={`p-1.5 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer ${
              bookmark.is_archived ? 'text-teal-600 dark:text-teal-400' : 'hover:text-teal-600'
            }`}
          >
            {bookmark.is_archived ? (
              <ArchiveRestore className="w-4 h-4" />
            ) : (
              <Archive className="w-4 h-4" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-1">
          {/* External link */}
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            title="Open original page"
            className="p-1.5 rounded-md hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
          </a>

          {/* Delete */}
          <button
            onClick={onDelete}
            title="Delete bookmark"
            className="p-1.5 rounded-md hover:text-red-600 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
