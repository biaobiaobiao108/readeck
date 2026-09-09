import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  ExternalLink,
  Star,
  Archive,
  ArchiveRestore,
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
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isToolbarVisible, setIsToolbarVisible] = useState(true);
  const lastScrollY = useRef(0);
  const mainRef = useRef<HTMLElement>(null);

  // 偏好持久化
  const [fontSize, setFontSize] = useState<number>(() => {
    const saved = localStorage.getItem('readeck_reader_font_size');
    return saved ? parseInt(saved, 10) : 18;
  });

  const [themeMode, setThemeMode] = useState<'paper' | 'dark' | 'white'>(() => {
    const saved = localStorage.getItem('readeck_reader_theme') as 'paper' | 'dark' | 'white' | null;
    if (saved) return saved;
    return document.documentElement.classList.contains('dark') ? 'dark' : 'paper';
  });

  const [fontFamily, setFontFamily] = useState<'serif' | 'sans'>(() => {
    const saved = localStorage.getItem('readeck_reader_font_family') as 'serif' | 'sans' | null;
    return saved || 'serif';
  });

  useEffect(() => {
    localStorage.setItem('readeck_reader_font_size', fontSize.toString());
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('readeck_reader_theme', themeMode);
  }, [themeMode]);

  useEffect(() => {
    localStorage.setItem('readeck_reader_font_family', fontFamily);
  }, [fontFamily]);

  // 键盘快捷键监听
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['input', 'textarea'].includes((e.target as HTMLElement).tagName.toLowerCase())) return;

      if (e.key === 'Escape') {
        onBack();
      } else if (e.key === 's' || e.key === 'S') {
        onToggleStar();
      } else if (e.key === 'e' || e.key === 'E' || e.key === 'a' || e.key === 'A') {
        onToggleArchive();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack, onToggleStar, onToggleArchive]);

  // 获取文章全文
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

  // 滚动时计算进度与工具栏隐现
  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const maxScroll = scrollHeight - clientHeight;
    if (maxScroll > 0) {
      setScrollProgress(Math.min(100, Math.max(0, (scrollTop / maxScroll) * 100)));
    }

    // 智能隐现浮岛
    const currentScrollY = scrollTop;
    if (currentScrollY < 60) {
      setIsToolbarVisible(true);
    } else if (currentScrollY > lastScrollY.current + 12) {
      setIsToolbarVisible(false); // 向下快速滚动，隐藏干扰
    } else if (currentScrollY < lastScrollY.current - 12) {
      setIsToolbarVisible(true); // 向上回滚，浮现控制条
    }
    lastScrollY.current = currentScrollY;
  };

  // 背景色方案
  const bgClasses = {
    paper: 'bg-[#F9F7F1] text-[#2C2723]',
    dark: 'bg-[#151514] text-[#E2DED6]',
    white: 'bg-white text-[#1C1C1A]',
  }[themeMode];

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col overflow-hidden transition-colors duration-300 ${bgClasses}`}
    >
      {/* 顶部微型阅读进度条 */}
      <div className="fixed top-0 left-0 right-0 h-[3px] bg-black/5 dark:bg-white/5 z-50">
        <div
          className="h-full bg-brand-600 dark:bg-brand-500 transition-all duration-100 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* 悬浮胶囊工具岛 (Floating Island Toolbar) */}
      <div
        className={`fixed top-4 left-1/2 -translate-x-1/2 z-40 transition-all duration-300 ease-out ${
          isToolbarVisible ? 'translate-y-0 opacity-100' : '-translate-y-12 opacity-0 pointer-events-none'
        }`}
      >
        <header className="h-11 px-3.5 rounded-full border border-black/8 dark:border-white/10 bg-paper-50/90 dark:bg-charcoal-900/90 backdrop-blur-md shadow-xl flex items-center gap-3 text-xs select-none">
          {/* 返回按钮 */}
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 py-1 px-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-charcoal-700 dark:text-paper-200 cursor-pointer font-medium"
            title="返回文章列表 (Esc)"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">返回</span>
          </button>

          <div className="h-3.5 w-px bg-black/10 dark:bg-white/10" />

          {/* 字号调节 */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFontSize((s) => Math.max(14, s - 2))}
              className="w-6 h-6 flex items-center justify-center font-bold hover:bg-black/5 dark:hover:bg-white/10 rounded-full cursor-pointer text-charcoal-700 dark:text-paper-200 text-xs"
              title="缩小字号"
            >
              A-
            </button>
            <span className="text-[11px] font-mono text-charcoal-400 w-5 text-center">{fontSize}</span>
            <button
              onClick={() => setFontSize((s) => Math.min(26, s + 2))}
              className="w-6 h-6 flex items-center justify-center font-bold hover:bg-black/5 dark:hover:bg-white/10 rounded-full cursor-pointer text-charcoal-700 dark:text-paper-200 text-xs"
              title="放大字号"
            >
              A+
            </button>
          </div>

          <div className="h-3.5 w-px bg-black/10 dark:bg-white/10" />

          {/* 字体切换：宋体 / 黑体 */}
          <button
            onClick={() => setFontFamily((f) => (f === 'serif' ? 'sans' : 'serif'))}
            className={`px-2 py-1 rounded-full text-[11px] font-medium transition-colors cursor-pointer ${
              fontFamily === 'serif'
                ? 'bg-black/8 dark:bg-white/12 text-charcoal-900 dark:text-paper-50 font-serif'
                : 'text-charcoal-500 hover:text-charcoal-900 dark:hover:text-paper-100 font-sans'
            }`}
            title="切换字体（宋体 / 黑体）"
          >
            {fontFamily === 'serif' ? '宋体' : '黑体'}
          </button>

          <div className="h-3.5 w-px bg-black/10 dark:bg-white/10" />

          {/* 主题底色切换 */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setThemeMode('paper')}
              className={`w-4 h-4 rounded-full bg-[#F9F7F1] border border-amber-300/80 cursor-pointer ${
                themeMode === 'paper' ? 'ring-2 ring-brand-600 ring-offset-1' : ''
              }`}
              title="宣纸暖白"
            />
            <button
              onClick={() => setThemeMode('white')}
              className={`w-4 h-4 rounded-full bg-white border border-neutral-300 cursor-pointer ${
                themeMode === 'white' ? 'ring-2 ring-brand-600 ring-offset-1' : ''
              }`}
              title="纯白明亮"
            />
            <button
              onClick={() => setThemeMode('dark')}
              className={`w-4 h-4 rounded-full bg-[#151514] border border-neutral-700 cursor-pointer ${
                themeMode === 'dark' ? 'ring-2 ring-brand-600 ring-offset-1' : ''
              }`}
              title="护眼夜墨"
            />
          </div>

          <div className="h-3.5 w-px bg-black/10 dark:bg-white/10" />

          {/* 标星 */}
          <button
            onClick={onToggleStar}
            className={`p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer ${
              bookmark.is_starred ? 'text-amber-500' : 'text-charcoal-400 hover:text-amber-500'
            }`}
            title={bookmark.is_starred ? '已收藏 (S)' : '添加收藏 (S)'}
          >
            <Star className={`w-3.5 h-3.5 ${bookmark.is_starred ? 'fill-current' : ''}`} />
          </button>

          {/* 归档 */}
          <button
            onClick={onToggleArchive}
            className={`p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer ${
              bookmark.is_archived
                ? 'text-brand-600 dark:text-brand-400'
                : 'text-charcoal-400 hover:text-brand-600'
            }`}
            title={bookmark.is_archived ? '移回稍后读 (E)' : '归档文章 (E)'}
          >
            {bookmark.is_archived ? (
              <ArchiveRestore className="w-3.5 h-3.5" />
            ) : (
              <Archive className="w-3.5 h-3.5" />
            )}
          </button>

          {/* 原文直达 */}
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-charcoal-400 hover:text-charcoal-700 dark:hover:text-paper-100 transition-colors cursor-pointer"
            title="在新标签页查看原始网页"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </header>
      </div>

      {/* 正文阅读滚动流 */}
      <main
        ref={mainRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-5 sm:px-8 py-16 sm:py-24 selection:bg-brand-500/20"
      >
        <article
          className={`max-w-[700px] mx-auto ${
            fontFamily === 'serif' ? 'font-serif' : 'font-sans'
          }`}
        >
          {/* 文章头部元数据 */}
          <header className="mb-10 space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-xs opacity-60 font-sans">
              <span className="flex items-center gap-1.5 font-medium">
                <Globe className="w-3 h-3" />
                {bookmark.site_name || '网络来源'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                约 {bookmark.reading_time || 1} 分钟阅读
              </span>
              {bookmark.author && (
                <>
                  <span>•</span>
                  <span>作者：{bookmark.author}</span>
                </>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight leading-[1.3] text-inherit">
              {bookmark.title}
            </h1>

            {bookmark.description && (
              <p className="text-sm sm:text-base opacity-75 font-sans leading-relaxed pt-1">
                {bookmark.description}
              </p>
            )}
          </header>

          {/* 封面图 */}
          {bookmark.thumbnail_url && (
            <div className="mb-10 rounded-2xl overflow-hidden shadow-xs">
              <img
                src={bookmark.thumbnail_url}
                alt={bookmark.title}
                className="w-full max-h-[420px] object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          )}

          {/* 文章正文 */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-28 text-brand-600 gap-3">
              <Loader2 className="w-7 h-7 animate-spin" />
              <span className="text-xs font-sans tracking-wide">正在解析并呈现排版...</span>
            </div>
          ) : content?.html ? (
            <div
              className="reader-content leading-relaxed"
              style={{ fontSize: `${fontSize}px` }}
              dangerouslySetInnerHTML={{ __html: content.html }}
            />
          ) : (
            <div className="py-20 text-center opacity-75 text-sm font-sans space-y-3">
              <p>暂未能提取到纯净文本内容。</p>
              <div>
                <a
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-brand-700 dark:text-brand-400 font-medium transition-colors"
                >
                  <span>直达原网页阅读</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          {/* 底部阅读完成打卡区 */}
          {!isLoading && content?.html && (
            <div className="mt-16 pt-8 border-t border-black/10 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 font-sans text-xs opacity-70">
              <span>恭喜读完本篇！</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={onToggleArchive}
                  className="px-3 py-1.5 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 transition-colors cursor-pointer"
                >
                  {bookmark.is_archived ? '移回稍后读' : '归档本篇 (E)'}
                </button>
                <button
                  onClick={onBack}
                  className="px-3 py-1.5 rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-colors cursor-pointer"
                >
                  返回列表 (Esc)
                </button>
              </div>
            </div>
          )}
        </article>
      </main>
    </div>
  );
};
