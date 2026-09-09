import React, { useState, useRef, useEffect } from 'react';
import {
  Star,
  Archive,
  ArchiveRestore,
  ExternalLink,
  Trash2,
  Clock,
  Globe,
  Edit3,
  MoreHorizontal,
} from 'lucide-react';
import type { Bookmark } from '@readeck/shared';

interface BookmarkListItemProps {
  bookmark: Bookmark;
  onClick: () => void;
  onToggleStar: (e: React.MouseEvent) => void;
  onToggleArchive: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  onEdit: (e: React.MouseEvent) => void;
  onSelectTag?: (tag: string) => void;
  showStatusBadge?: boolean;
  isSelected?: boolean;
}

export const BookmarkListItem: React.FC<BookmarkListItemProps> = ({
  bookmark,
  onClick,
  onToggleStar,
  onToggleArchive,
  onDelete,
  onEdit,
  onSelectTag,
  showStatusBadge = false,
  isSelected = false,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  const formattedDate = new Date(bookmark.created_at).toLocaleDateString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
  });

  return (
    <article
      onClick={onClick}
      className={`group relative bg-paper-100/35 dark:bg-charcoal-900/80 border rounded-2xl p-4 sm:p-5 cursor-pointer transition-all duration-200 flex flex-col sm:flex-row gap-4 sm:gap-6 justify-between items-start hover:shadow-md hover:border-paper-300 dark:hover:border-charcoal-700 ${
        isSelected
          ? 'border-brand-600 dark:border-brand-500 ring-2 ring-brand-500/20 shadow-md'
          : 'border-paper-200 dark:border-charcoal-800/80'
      }`}
    >
      {/* 左侧文字与元数据 */}
      <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
        <div>
          {/* 元数据行 */}
          <div className="flex items-center gap-2 text-xs text-charcoal-400 dark:text-charcoal-500 mb-1.5">
            <span className="flex items-center gap-1.5 font-medium truncate max-w-[140px] text-charcoal-500 dark:text-charcoal-400">
              <Globe className="w-3 h-3 flex-shrink-0 opacity-70" />
              {bookmark.site_name || '网络文章'}
            </span>
            <span className="opacity-40">•</span>
            <span className="flex items-center gap-1 flex-shrink-0">
              <Clock className="w-3 h-3 opacity-70" />
              {bookmark.reading_time || 1} 分钟
            </span>
            <span className="opacity-40">•</span>
            <span className="flex-shrink-0">{formattedDate}</span>

            {showStatusBadge && (
              <>
                <span className="opacity-40">•</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-sm font-medium ${
                    bookmark.is_archived
                      ? 'bg-paper-200 dark:bg-charcoal-800 text-charcoal-500'
                      : 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300'
                  }`}
                >
                  {bookmark.is_archived ? '已归档' : '稍后读'}
                </span>
              </>
            )}
          </div>

          {/* 标题 */}
          <h2 className="font-serif font-bold text-base sm:text-lg text-charcoal-900 dark:text-paper-50 line-clamp-2 mb-2 leading-snug group-hover:text-brand-700 dark:group-hover:text-brand-400 transition-colors">
            {bookmark.title}
          </h2>

          {/* 摘要 */}
          {bookmark.description && (
            <p className="text-xs sm:text-sm text-charcoal-500 dark:text-charcoal-400 line-clamp-2 leading-relaxed mb-3 font-sans">
              {bookmark.description}
            </p>
          )}
        </div>

        {/* 标签列表 */}
        {bookmark.tags && bookmark.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {bookmark.tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSelectTag) onSelectTag(tag);
                }}
                className="inline-flex items-center text-[11px] px-2 py-0.5 rounded-md bg-paper-200/70 hover:bg-brand-100 dark:bg-charcoal-800 dark:hover:bg-charcoal-700 text-charcoal-600 hover:text-brand-800 dark:text-charcoal-300 dark:hover:text-brand-300 font-medium transition-colors cursor-pointer"
                title={`查看标签 #${tag}`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 右侧配图 (如果有) */}
      {bookmark.thumbnail_url && (
        <div className="w-full sm:w-36 md:w-44 h-28 sm:h-28 rounded-xl overflow-hidden bg-paper-200/50 dark:bg-charcoal-800/50 flex-shrink-0 relative">
          <img
            src={bookmark.thumbnail_url}
            alt={bookmark.title}
            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500 ease-out"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>
      )}

      {/* 悬浮微操作栏 (Hover Reveal) */}
      <div
        className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-10 bg-paper-50/90 dark:bg-charcoal-900/90 backdrop-blur-md rounded-xl p-1 border border-paper-200/80 dark:border-charcoal-700/80 shadow-md"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onToggleStar}
          title={bookmark.is_starred ? '取消收藏 (S)' : '添加收藏 (S)'}
          className={`p-1.5 rounded-lg hover:bg-paper-200 dark:hover:bg-charcoal-800 transition-colors cursor-pointer ${
            bookmark.is_starred ? 'text-amber-500 fill-amber-500' : 'text-charcoal-400 hover:text-amber-500'
          }`}
        >
          <Star className={`w-3.5 h-3.5 ${bookmark.is_starred ? 'fill-current' : ''}`} />
        </button>

        <button
          onClick={onToggleArchive}
          title={bookmark.is_archived ? '移回稍后读 (E)' : '归档此文章 (E)'}
          className={`p-1.5 rounded-lg hover:bg-paper-200 dark:hover:bg-charcoal-800 transition-colors cursor-pointer ${
            bookmark.is_archived ? 'text-brand-600 dark:text-brand-400' : 'text-charcoal-400 hover:text-brand-600'
          }`}
        >
          {bookmark.is_archived ? (
            <ArchiveRestore className="w-3.5 h-3.5" />
          ) : (
            <Archive className="w-3.5 h-3.5" />
          )}
        </button>

        {/* 更多菜单 ··· */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen((prev) => !prev)}
            title="更多操作"
            className="p-1.5 rounded-lg text-charcoal-400 hover:text-charcoal-700 dark:hover:text-paper-100 hover:bg-paper-200 dark:hover:bg-charcoal-800 transition-colors cursor-pointer"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-36 bg-paper-50 dark:bg-charcoal-900 border border-paper-200 dark:border-charcoal-700 rounded-xl shadow-xl py-1 z-30 animate-fade-in text-xs font-sans">
              <button
                onClick={(e) => {
                  setIsMenuOpen(false);
                  onEdit(e);
                }}
                className="w-full px-3 py-2 flex items-center gap-2 text-charcoal-700 dark:text-charcoal-200 hover:bg-paper-100 dark:hover:bg-charcoal-800 text-left cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-charcoal-400" />
                <span>编辑文章</span>
              </button>

              <a
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsMenuOpen(false)}
                className="w-full px-3 py-2 flex items-center gap-2 text-charcoal-700 dark:text-charcoal-200 hover:bg-paper-100 dark:hover:bg-charcoal-800 text-left cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5 text-charcoal-400" />
                <span>查看原网页</span>
              </a>

              <div className="my-1 border-t border-paper-200 dark:border-charcoal-800" />

              <button
                onClick={(e) => {
                  setIsMenuOpen(false);
                  onDelete(e);
                }}
                className="w-full px-3 py-2 flex items-center gap-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 text-left cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>删除文章</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
};
