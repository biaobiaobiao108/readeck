import React, { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, BookmarkX, Plus, Menu, X, ArrowDown } from 'lucide-react';
import type { Bookmark, CreateBookmarkDTO, Tag, UpdateBookmarkDTO, User } from '@readeck/shared';
import { api } from './api/client.ts';
import { Sidebar } from './components/Sidebar.tsx';
import { BookmarkCard } from './components/BookmarkCard.tsx';
import { AddBookmarkModal } from './components/AddBookmarkModal.tsx';
import { EditBookmarkModal } from './components/EditBookmarkModal.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { ReaderView } from './components/ReaderView.tsx';
import { AuthView } from './components/AuthView.tsx';
import { ToastContainer, type ToastMessage } from './components/Toast.tsx';

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Theme Management
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

  // Filters & State
  const [status, setStatus] = useState<'unread' | 'archive' | 'favorite' | 'all'>('unread');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [tags, setTags] = useState<Tag[]>([]);

  // Search debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Bookmarks & Pagination
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [totalBookmarks, setTotalBookmarks] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [isLoadingBookmarks, setIsLoadingBookmarks] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Modals & Navigation
  const [activeBookmark, setActiveBookmark] = useState<Bookmark | null>(null);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Toast Notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const addToast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Initialize Auth
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
      addToast('error', 'Session expired. Please sign in again.');
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [addToast]);

  // Fetch Tags
  const loadTags = useCallback(async () => {
    if (!api.isAuthenticated()) return;
    try {
      const data = await api.getTags();
      setTags(data);
    } catch (err) {
      console.error('Failed to load tags:', err);
    }
  }, []);

  // Fetch Bookmarks (Initial or on filter change)
  const loadBookmarks = useCallback(
    async (resetPage = true) => {
      if (!api.isAuthenticated()) return;
      const targetPage = resetPage ? 1 : page;
      if (resetPage) {
        setIsLoadingBookmarks(true);
        setPage(1);
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
        console.error('Failed to load bookmarks:', err);
        addToast('error', 'Failed to load bookmarks');
      } finally {
        setIsLoadingBookmarks(false);
        setIsLoadingMore(false);
      }
    },
    [status, selectedTag, debouncedSearch, page, addToast]
  );

  // Trigger reload on filter / search changes
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
      addToast('error', 'Failed to load more bookmarks');
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Handlers
  const handleSaveBookmark = async (dto: CreateBookmarkDTO) => {
    try {
      const created = await api.createBookmark(dto);
      addToast('success', `Saved "${created.title}"`);
      await loadBookmarks(true);
      await loadTags();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save bookmark';
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
      addToast('success', 'Bookmark updated successfully');
      loadTags();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update bookmark';
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
        updated.is_starred ? 'Added to favorites' : 'Removed from favorites'
      );
      if (status === 'favorite') {
        loadBookmarks(true);
      }
    } catch {
      addToast('error', 'Failed to update favorite status');
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
        updated.is_archived ? 'Moved to Archive' : 'Moved to Unread'
      );
      if (status !== 'all') {
        loadBookmarks(true);
      }
    } catch {
      addToast('error', 'Failed to update archive status');
    }
  };

  const handleDelete = async (bookmark: Bookmark, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Delete bookmark "${bookmark.title}"?`)) return;

    try {
      await api.deleteBookmark(bookmark.id);
      setBookmarks((prev) => prev.filter((b) => b.id !== bookmark.id));
      setTotalBookmarks((prev) => Math.max(0, prev - 1));
      if (activeBookmark?.id === bookmark.id) {
        setActiveBookmark(null);
      }
      addToast('success', 'Bookmark deleted');
      loadTags();
    } catch {
      addToast('error', 'Failed to delete bookmark');
    }
  };

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    setBookmarks([]);
    addToast('info', 'Logged out');
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (!user) {
    return <AuthView onSuccess={(u) => setUser(u)} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50 dark:bg-neutral-950">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Sidebar (Responsive Drawer on mobile, fixed on desktop) */}
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
        isDarkTheme={isDarkTheme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-neutral-200 dark:border-neutral-800 px-4 sm:px-6 flex items-center justify-between bg-white dark:bg-neutral-900 flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Menu Button */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-2 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 md:hidden cursor-pointer"
              title="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <h1 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-neutral-50 capitalize truncate max-w-[150px] sm:max-w-none">
              {selectedTag ? `#${selectedTag}` : status}
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 font-medium font-mono">
              {totalBookmarks} {totalBookmarks === 1 ? 'item' : 'items'}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 max-w-md w-full justify-end">
            <div className="relative w-full max-w-xs">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search bookmarks..."
                className="w-full pl-9 pr-8 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500 text-neutral-900 dark:text-neutral-100"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="p-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition-colors cursor-pointer sm:hidden flex-shrink-0"
              title="Add Bookmark"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Bookmarks Grid / Empty state */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {isLoadingBookmarks ? (
            <div className="flex flex-col items-center justify-center py-24 text-teal-600 gap-3">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="text-sm font-medium">Loading bookmarks...</span>
            </div>
          ) : bookmarks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-28 text-center max-w-sm mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 mb-4">
                <BookmarkX className="w-8 h-8" />
              </div>
              <h3 className="font-semibold text-lg text-neutral-800 dark:text-neutral-200 mb-1">
                No bookmarks found
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-6 leading-relaxed">
                {debouncedSearch
                  ? `No bookmarks match "${debouncedSearch}".`
                  : selectedTag
                    ? `No bookmarks are tagged with #${selectedTag}.`
                    : 'Save links from the web to read them later in a clean, distraction-free view.'}
              </p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add your first bookmark</span>
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {bookmarks.map((bookmark) => (
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
                  />
                ))}
              </div>

              {/* Pagination / Load more control */}
              {hasMore && (
                <div className="flex flex-col items-center justify-center pt-4 pb-8 gap-2">
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="px-6 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-sm font-medium text-neutral-700 dark:text-neutral-200 flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isLoadingMore ? (
                      <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                    ) : (
                      <ArrowDown className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    )}
                    <span>{isLoadingMore ? 'Loading more...' : 'Load more bookmarks'}</span>
                  </button>
                  <span className="text-xs text-neutral-400">
                    Showing {bookmarks.length} of {totalBookmarks} items
                  </span>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Reader View Modal */}
      {activeBookmark && (
        <ReaderView
          bookmark={activeBookmark}
          onBack={() => setActiveBookmark(null)}
          onToggleStar={() => handleToggleStar(activeBookmark)}
          onToggleArchive={() => handleToggleArchive(activeBookmark)}
        />
      )}

      {/* Add Bookmark Modal */}
      <AddBookmarkModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleSaveBookmark}
        existingTags={tags}
      />

      {/* Edit Bookmark Modal */}
      <EditBookmarkModal
        bookmark={editingBookmark}
        isOpen={!!editingBookmark}
        onClose={() => setEditingBookmark(null)}
        onSubmit={handleEditBookmark}
      />

      {/* Settings / Extension Token Modal */}
      {user && (
        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          user={user}
        />
      )}
    </div>
  );
};

