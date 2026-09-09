import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search,
  Loader2,
  BookmarkX,
  Plus,
  Menu,
  X,
  ArrowDown,
  LayoutList,
  LayoutGrid,
  Keyboard,
} from 'lucide-react';
import type { Bookmark, CreateBookmarkDTO, Tag, UpdateBookmarkDTO, User } from '@readeck/shared';
import { api } from './api/client.ts';
import { Sidebar } from './components/Sidebar.tsx';
import { BookmarkCard } from './components/BookmarkCard.tsx';
import { BookmarkListItem } from './components/BookmarkListItem.tsx';
import { AddBookmarkModal } from './components/AddBookmarkModal.tsx';
import { EditBookmarkModal } from './components/EditBookmarkModal.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { ShortcutsHelpModal } from './components/ShortcutsHelpModal.tsx';
import { ReaderView } from './components/ReaderView.tsx';
import { AuthView } from './components/AuthView.tsx';
import { ToastContainer, type ToastMessage } from './components/Toast.tsx';

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // 主题模式 (Theme Management)
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(() => {
    const saved = localStorage.getItem('readeck_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDarkTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('readeck_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('readeck_theme', 'light');
    }
  }, [isDarkTheme]);

  const toggleTheme = () => setIsDarkTheme((prev) => !prev);

  // 视图模式：'list' (杂志列表) | 'grid' (卡片网格)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>(() => {
    const saved = localStorage.getItem('readeck_view_mode') as 'list' | 'grid' | null;
    return saved || 'list';
  });

  const handleViewModeChange = (mode: 'list' | 'grid') => {
    setViewMode(mode);
    localStorage.setItem('readeck_view_mode', mode);
  };

  // 筛选与搜索
  const [status, setStatus] = useState<'unread' | 'archive' | 'favorite' | 'all'>('unread');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [tags, setTags] = useState<Tag[]>([]);

  // 键盘快捷键选中的文章索引
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // 搜索防抖
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 书签与分页
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [totalBookmarks, setTotalBookmarks] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [isLoadingBookmarks, setIsLoadingBookmarks] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // 弹窗与抽屉
  const [activeBookmark, setActiveBookmark] = useState<Bookmark | null>(null);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // 通知气泡
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const addToast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // 校验登录状态
  useEffect(() => {
    if (api.isAuthenticated()) {
      api
        .getProfile()
        .then((u) => setUser(u))
        .catch(() => {
          api.setToken(null);
          setUser(null);
        })
        .finally(() => setIsInitializing(false));
    } else {
      setIsInitializing(false);
    }

    const handleUnauthorized = () => {
      setUser(null);
      addToast('error', '登录凭证已过期，请重新登录');
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [addToast]);

  // 获取标签列表
  const loadTags = useCallback(async () => {
    if (!api.isAuthenticated()) return;
    try {
      const data = await api.getTags();
      setTags(data);
    } catch (err) {
      console.error('加载标签失败:', err);
    }
  }, []);

  // 获取书签列表
  const loadBookmarks = useCallback(
    async (resetPage = true) => {
      if (!api.isAuthenticated()) return;
      const targetPage = resetPage ? 1 : page;
      if (resetPage) {
        setIsLoadingBookmarks(true);
        setPage(1);
        setSelectedIndex(null);
      } else {
        setIsLoadingMore(true);
      }

      try {
        const res = await api.getBookmarks({
          status,
          tag: selectedTag || undefined,
          search: debouncedSearch || undefined,
          page: targetPage,
          limit: 20,
        });

        if (resetPage) {
          setBookmarks(res.items);
        } else {
          setBookmarks((prev) => [...prev, ...res.items]);
        }

        setTotalBookmarks(res.total);
        setHasMore(res.has_more);
      } catch (err) {
        console.error('加载文章失败:', err);
        addToast('error', '加载文章列表失败');
      } finally {
        setIsLoadingBookmarks(false);
        setIsLoadingMore(false);
      }
    },
    [status, selectedTag, debouncedSearch, page, addToast]
  );

  // 筛选发生变动时重新加载
  useEffect(() => {
    if (user) {
      loadBookmarks(true);
      loadTags();
    }
  }, [user, status, selectedTag, debouncedSearch, loadTags]);

  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore) return;
    const nextPage = page + 1;
    setIsLoadingMore(true);
    try {
      const res = await api.getBookmarks({
        status,
        tag: selectedTag || undefined,
        search: debouncedSearch || undefined,
        page: nextPage,
        limit: 20,
      });
      setBookmarks((prev) => [...prev, ...res.items]);
      setPage(nextPage);
      setHasMore(res.has_more);
      setTotalBookmarks(res.total);
    } catch (err) {
      addToast('error', '加载更多文章失败');
    } finally {
      setIsLoadingMore(false);
    }
  };

  // 动作处理函数
  const handleSaveBookmark = async (dto: CreateBookmarkDTO) => {
    try {
      const created = await api.createBookmark(dto);
      addToast('success', `已保存《${created.title}》`);
      await loadBookmarks(true);
      await loadTags();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '保存文章失败';
      addToast('error', msg);
      throw err;
    }
  };

  const handleEditBookmark = async (id: number, dto: UpdateBookmarkDTO) => {
    try {
      const updated = await api.updateBookmark(id, dto);
      setBookmarks((prev) => prev.map((b) => (b.id === id ? updated : b)));
      if (activeBookmark?.id === id) {
        setActiveBookmark(updated);
      }
      addToast('success', '文章详情已更新');
      loadTags();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '更新文章失败';
      addToast('error', msg);
      throw err;
    }
  };

  const handleToggleStar = async (bookmark: Bookmark, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const updated = await api.updateBookmark(bookmark.id, {
        is_starred: !bookmark.is_starred,
      });
      setBookmarks((prev) => prev.map((b) => (b.id === bookmark.id ? updated : b)));
      if (activeBookmark?.id === bookmark.id) {
        setActiveBookmark(updated);
      }
      addToast(
        'success',
        updated.is_starred ? '已加入星标收藏' : '已取消星标收藏'
      );
      if (status === 'favorite') {
        loadBookmarks(true);
      }
    } catch {
      addToast('error', '更新星标状态失败');
    }
  };

  const handleToggleArchive = async (bookmark: Bookmark, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const updated = await api.updateBookmark(bookmark.id, {
        is_archived: !bookmark.is_archived,
      });
      setBookmarks((prev) => prev.map((b) => (b.id === bookmark.id ? updated : b)));
      if (activeBookmark?.id === bookmark.id) {
        setActiveBookmark(updated);
      }
      addToast(
        'success',
        updated.is_archived ? '已移动至沉思归档' : '已移回稍后读'
      );
      if (status !== 'all') {
        loadBookmarks(true);
      }
    } catch {
      addToast('error', '更新归档状态失败');
    }
  };

  const handleDelete = async (bookmark: Bookmark, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`确定要永久删除《${bookmark.title}》吗？`)) return;

    try {
      await api.deleteBookmark(bookmark.id);
      setBookmarks((prev) => prev.filter((b) => b.id !== bookmark.id));
      setTotalBookmarks((prev) => Math.max(0, prev - 1));
      if (activeBookmark?.id === bookmark.id) {
        setActiveBookmark(null);
      }
      addToast('success', `已删除《${bookmark.title}》`);
      loadTags();
    } catch {
      addToast('error', '删除文章失败');
    }
  };

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    setBookmarks([]);
    addToast('info', '已安全退出登录');
  };

  // 全局键盘快捷键
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // 若当前在输入框内，不拦截字符按键
      const target = e.target as HTMLElement;
      if (['input', 'textarea'].includes(target.tagName.toLowerCase())) {
        if (e.key === 'Escape') {
          target.blur();
        }
        return;
      }

      // 弹窗打开时不响应主界面快捷键
      const isModalActive =
        activeBookmark ||
        editingBookmark ||
        isAddModalOpen ||
        isSettingsModalOpen ||
        isShortcutsModalOpen ||
        isMobileSidebarOpen;

      if (isModalActive) return;

      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setIsShortcutsModalOpen((prev) => !prev);
        return;
      }

      if (bookmarks.length === 0) return;

      if (e.key === 'j' || e.key === 'J' || e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => {
          if (prev === null || prev >= bookmarks.length - 1) return 0;
          return prev + 1;
        });
      } else if (e.key === 'k' || e.key === 'K' || e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => {
          if (prev === null || prev <= 0) return bookmarks.length - 1;
          return prev - 1;
        });
      } else if (e.key === 'Enter') {
        if (selectedIndex !== null && bookmarks[selectedIndex]) {
          e.preventDefault();
          setActiveBookmark(bookmarks[selectedIndex]);
        }
      } else if (e.key === 's' || e.key === 'S') {
        if (selectedIndex !== null && bookmarks[selectedIndex]) {
          e.preventDefault();
          handleToggleStar(bookmarks[selectedIndex]);
        }
      } else if (e.key === 'e' || e.key === 'E') {
        if (selectedIndex !== null && bookmarks[selectedIndex]) {
          e.preventDefault();
          handleToggleArchive(bookmarks[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        setSelectedIndex(null);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [
    bookmarks,
    selectedIndex,
    activeBookmark,
    editingBookmark,
    isAddModalOpen,
    isSettingsModalOpen,
    isShortcutsModalOpen,
    isMobileSidebarOpen,
  ]);

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper-50 dark:bg-charcoal-950">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600 dark:text-brand-500" />
      </div>
    );
  }

  if (!user) {
    return <AuthView onSuccess={(u) => setUser(u)} />;
  }

  // 顶部标题计算
  const getHeaderTitle = () => {
    if (selectedTag) return `#${selectedTag}`;
    switch (status) {
      case 'unread':
        return '稍后读';
      case 'archive':
        return '沉思归档';
      case 'favorite':
        return '星标精选';
      case 'all':
        return '全部馆藏';
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-paper-50 dark:bg-charcoal-950 font-sans selection:bg-brand-500/20 selection:text-brand-900">
      {/* Toast 提示容器 */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* 侧边导航栏 */}
      <Sidebar
        currentStatus={status}
        onStatusChange={(s) => {
          setStatus(s);
          setSelectedTag(null);
        }}
        selectedTag={selectedTag}
        onTagSelect={(t) => setSelectedTag(t)}
        tags={tags}
        user={user}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onLogout={handleLogout}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
        isDarkTheme={isDarkTheme}
        onToggleTheme={toggleTheme}
      />

      {/* 主界面内容区 */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* 顶部优雅导航栏 */}
        <header className="h-16 border-b border-paper-200/80 dark:border-charcoal-800 px-4 sm:px-8 flex items-center justify-between bg-paper-50/80 dark:bg-charcoal-950/80 backdrop-blur-md flex-shrink-0 z-10">
          <div className="flex items-center gap-3">
            {/* 移动端汉堡菜单 */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-2 rounded-xl text-charcoal-600 dark:text-paper-300 hover:bg-paper-200/60 dark:hover:bg-charcoal-800 md:hidden cursor-pointer"
              title="打开侧栏"
            >
              <Menu className="w-5 h-5" />
            </button>

            <h1 className="font-serif text-lg sm:text-xl font-bold text-charcoal-900 dark:text-paper-50 tracking-tight truncate max-w-[160px] sm:max-w-none">
              {getHeaderTitle()}
            </h1>

            <span className="text-xs px-2.5 py-0.5 rounded-full bg-paper-200/70 dark:bg-charcoal-800 text-charcoal-500 dark:text-charcoal-400 font-medium">
              共 {totalBookmarks} 篇
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 max-w-lg w-full justify-end">
            {/* 搜索框 */}
            <div className="relative w-full max-w-xs">
              <Search className="w-3.5 h-3.5 text-charcoal-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索标题、摘要或标签... (按 / 聚焦)"
                className="w-full pl-9 pr-8 py-1.5 rounded-xl border border-paper-200 dark:border-charcoal-800 bg-paper-100/50 dark:bg-charcoal-900/60 text-xs focus:outline-hidden focus:ring-2 focus:ring-brand-500 text-charcoal-900 dark:text-paper-100 placeholder:text-charcoal-400 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-charcoal-600 dark:hover:text-paper-200 cursor-pointer"
                  title="清除搜索"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* 视图切换按钮：列表 vs 网格 */}
            <div className="hidden sm:flex items-center bg-paper-200/60 dark:bg-charcoal-900 rounded-xl p-0.5 border border-paper-200 dark:border-charcoal-800">
              <button
                onClick={() => handleViewModeChange('list')}
                title="杂志列表视图"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-paper-50 dark:bg-charcoal-800 text-charcoal-900 dark:text-paper-50 shadow-2xs'
                    : 'text-charcoal-400 hover:text-charcoal-700 dark:hover:text-paper-200'
                }`}
              >
                <LayoutList className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleViewModeChange('grid')}
                title="杂志卡片网格"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-paper-50 dark:bg-charcoal-800 text-charcoal-900 dark:text-paper-50 shadow-2xs'
                    : 'text-charcoal-400 hover:text-charcoal-700 dark:hover:text-paper-200'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 快捷键提示 */}
            <button
              onClick={() => setIsShortcutsModalOpen(true)}
              title="快捷键速查 (?)"
              className="p-2 rounded-xl text-charcoal-400 hover:text-charcoal-700 dark:hover:text-paper-200 hover:bg-paper-200/60 dark:hover:bg-charcoal-800 transition-colors cursor-pointer hidden md:flex items-center justify-center"
            >
              <Keyboard className="w-4 h-4" />
            </button>

            {/* 移动端添加按钮 */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="p-2 rounded-xl bg-charcoal-900 hover:bg-charcoal-800 text-paper-50 dark:bg-paper-100 dark:hover:bg-white dark:text-charcoal-900 shadow-xs transition-colors cursor-pointer sm:hidden flex-shrink-0"
              title="添加文章"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* 文章列表与主阅读流 */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          {isLoadingBookmarks ? (
            <div className="flex flex-col items-center justify-center py-28 text-brand-600 gap-3">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="text-xs font-medium text-charcoal-500 dark:text-charcoal-400">
                正在整理馆藏...
              </span>
            </div>
          ) : bookmarks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center max-w-md mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-paper-200/70 dark:bg-charcoal-800 flex items-center justify-center text-charcoal-400 mb-4">
                <BookmarkX className="w-7 h-7 stroke-[1.5]" />
              </div>
              <h3 className="font-serif font-bold text-lg text-charcoal-900 dark:text-paper-100 mb-1.5">
                暂未检索到文章
              </h3>
              <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mb-6 leading-relaxed font-serif">
                {debouncedSearch
                  ? `未找到与“${debouncedSearch}”匹配的内容。`
                  : selectedTag
                    ? `标签 #${selectedTag} 下暂无文章。`
                    : status === 'unread'
                      ? '暂无待读内容，泡一杯咖啡，享受当下。'
                      : '馆藏中暂无相关文章，保存好文随时翻阅。'}
              </p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 bg-charcoal-900 hover:bg-charcoal-800 text-paper-50 dark:bg-paper-100 dark:hover:bg-white dark:text-charcoal-900 text-xs font-medium rounded-xl flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>添加第一篇文章</span>
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {/* 列表模式 vs 网格模式 */}
              {viewMode === 'list' ? (
                <div className="max-w-4xl mx-auto space-y-4">
                  {bookmarks.map((bookmark, idx) => (
                    <BookmarkListItem
                      key={bookmark.id}
                      bookmark={bookmark}
                      onClick={() => setActiveBookmark(bookmark)}
                      onToggleStar={(e) => handleToggleStar(bookmark, e)}
                      onToggleArchive={(e) => handleToggleArchive(bookmark, e)}
                      onDelete={(e) => handleDelete(bookmark, e)}
                      onEdit={(e) => {
                        e.stopPropagation();
                        setEditingBookmark(bookmark);
                      }}
                      onSelectTag={(tag) => setSelectedTag(tag)}
                      showStatusBadge={status === 'all' || status === 'favorite'}
                      isSelected={selectedIndex === idx}
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {bookmarks.map((bookmark, idx) => (
                    <BookmarkCard
                      key={bookmark.id}
                      bookmark={bookmark}
                      onClick={() => setActiveBookmark(bookmark)}
                      onToggleStar={(e) => handleToggleStar(bookmark, e)}
                      onToggleArchive={(e) => handleToggleArchive(bookmark, e)}
                      onDelete={(e) => handleDelete(bookmark, e)}
                      onEdit={(e) => {
                        e.stopPropagation();
                        setEditingBookmark(bookmark);
                      }}
                      onSelectTag={(tag) => setSelectedTag(tag)}
                      showStatusBadge={status === 'all' || status === 'favorite'}
                      isSelected={selectedIndex === idx}
                    />
                  ))}
                </div>
              )}

              {/* 加载更多 */}
              {hasMore && (
                <div className="flex flex-col items-center justify-center pt-4 pb-12 gap-2">
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="px-6 py-2 rounded-xl border border-paper-300 dark:border-charcoal-700 bg-paper-100/50 dark:bg-charcoal-900 hover:bg-paper-200/60 dark:hover:bg-charcoal-800 text-xs font-medium text-charcoal-700 dark:text-paper-200 flex items-center gap-2 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isLoadingMore ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-600" />
                    ) : (
                      <ArrowDown className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                    )}
                    <span>{isLoadingMore ? '正在加载...' : '加载更多文章'}</span>
                  </button>
                  <span className="text-[11px] text-charcoal-400">
                    已载入 {bookmarks.length} / 共 {totalBookmarks} 篇
                  </span>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* 沉浸式阅读器 */}
      {activeBookmark && (
        <ReaderView
          bookmark={activeBookmark}
          onBack={() => setActiveBookmark(null)}
          onToggleStar={() => handleToggleStar(activeBookmark)}
          onToggleArchive={() => handleToggleArchive(activeBookmark)}
        />
      )}

      {/* 添加新文章弹窗 */}
      <AddBookmarkModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleSaveBookmark}
        existingTags={tags}
      />

      {/* 编辑文章弹窗 */}
      <EditBookmarkModal
        bookmark={editingBookmark}
        isOpen={!!editingBookmark}
        onClose={() => setEditingBookmark(null)}
        onSubmit={handleEditBookmark}
      />

      {/* 账户设置与插件授权弹窗 */}
      {user && (
        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          user={user}
        />
      )}

      {/* 快捷键指南面板 */}
      <ShortcutsHelpModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />
    </div>
  );
};
