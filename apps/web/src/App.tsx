import React, { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, BookmarkX, Plus } from 'lucide-react';
import type { Bookmark, CreateBookmarkDTO, Tag, User } from '@readeck/shared';
import { api } from './api/client.ts';
import { Sidebar } from './components/Sidebar.tsx';
import { BookmarkCard } from './components/BookmarkCard.tsx';
import { AddBookmarkModal } from './components/AddBookmarkModal.tsx';
import { ReaderView } from './components/ReaderView.tsx';
import { AuthView } from './components/AuthView.tsx';

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Filters & State
  const [status, setStatus] = useState<'unread' | 'archive' | 'favorite' | 'all'>('unread');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [tags, setTags] = useState<Tag[]>([]);

  // Bookmarks
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLoadingBookmarks, setIsLoadingBookmarks] = useState(false);
  const [activeBookmark, setActiveBookmark] = useState<Bookmark | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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

    const handleUnauthorized = () => setUser(null);
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

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

  // Fetch Bookmarks
  const loadBookmarks = useCallback(async () => {
    if (!api.isAuthenticated()) return;
    setIsLoadingBookmarks(true);
    try {
      const res = await api.getBookmarks({
        status,
        tag: selectedTag || undefined,
        search: searchQuery.trim() || undefined,
      });
      setBookmarks(res.items);
    } catch (err) {
      console.error('Failed to load bookmarks:', err);
    } finally {
      setIsLoadingBookmarks(false);
    }
  }, [status, selectedTag, searchQuery]);

  useEffect(() => {
    if (user) {
      loadBookmarks();
      loadTags();
    }
  }, [user, loadBookmarks, loadTags]);

  // Handlers
  const handleSaveBookmark = async (dto: CreateBookmarkDTO) => {
    await api.createBookmark(dto);
    await loadBookmarks();
    await loadTags();
  };

  const handleToggleStar = async (bookmark: Bookmark, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = await api.updateBookmark(bookmark.id, {
      is_starred: !bookmark.is_starred,
    });
    setBookmarks((prev) => prev.map((b) => (b.id === bookmark.id ? updated : b)));
    if (activeBookmark?.id === bookmark.id) {
      setActiveBookmark(updated);
    }
  };

  const handleToggleArchive = async (bookmark: Bookmark, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = await api.updateBookmark(bookmark.id, {
      is_archived: !bookmark.is_archived,
    });
    setBookmarks((prev) => prev.map((b) => (b.id === bookmark.id ? updated : b)));
    if (activeBookmark?.id === bookmark.id) {
      setActiveBookmark(updated);
    }
    // Refresh if we are in unread/archive view
    if (status !== 'all') {
      loadBookmarks();
    }
  };

  const handleDelete = async (bookmark: Bookmark, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Delete bookmark "${bookmark.title}"?`)) return;

    await api.deleteBookmark(bookmark.id);
    setBookmarks((prev) => prev.filter((b) => b.id !== bookmark.id));
    if (activeBookmark?.id === bookmark.id) {
      setActiveBookmark(null);
    }
    loadTags();
  };

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    setBookmarks([]);
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
      {/* Sidebar */}
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
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-neutral-200 dark:border-neutral-800 px-6 flex items-center justify-between bg-white dark:bg-neutral-900 flex-shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-50 capitalize">
              {selectedTag ? `#${selectedTag}` : status}
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 font-medium font-mono">
              {bookmarks.length} items
            </span>
          </div>

          <div className="flex items-center gap-3 max-w-md w-full justify-end">
            <div className="relative w-full max-w-xs">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search bookmarks..."
                className="w-full pl-9 pr-4 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="p-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition-colors cursor-pointer sm:hidden"
              title="Add Bookmark"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Bookmarks Grid / Empty state */}
        <main className="flex-1 overflow-y-auto p-6">
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
                {searchQuery
                  ? 'No bookmarks match your search query.'
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {bookmarks.map((bookmark) => (
                <BookmarkCard
                  key={bookmark.id}
                  bookmark={bookmark}
                  onClick={() => setActiveBookmark(bookmark)}
                  onToggleStar={(e) => handleToggleStar(bookmark, e)}
                  onToggleArchive={(e) => handleToggleArchive(bookmark, e)}
                  onDelete={(e) => handleDelete(bookmark, e)}
                />
              ))}
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
      />
    </div>
  );
};
