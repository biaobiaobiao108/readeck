import React from 'react';
import {
  Inbox,
  Archive,
  Star,
  BookOpen,
  Plus,
  Tag as TagIcon,
  LogOut,
  Bookmark as BookmarkIcon,
  Settings as SettingsIcon,
  Sun,
  Moon,
  X,
} from 'lucide-react';
import type { Tag, User } from '@readeck/shared';

interface SidebarProps {
  currentStatus: 'unread' | 'archive' | 'favorite' | 'all';
  onStatusChange: (status: 'unread' | 'archive' | 'favorite' | 'all') => void;
  selectedTag: string | null;
  onTagSelect: (tag: string | null) => void;
  tags: Tag[];
  user: User | null;
  onOpenAddModal: () => void;
  onLogout: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  onOpenSettings?: () => void;
  isDarkTheme?: boolean;
  onToggleTheme?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentStatus,
  onStatusChange,
  selectedTag,
  onTagSelect,
  tags,
  user,
  onOpenAddModal,
  onLogout,
  isOpenMobile = false,
  onCloseMobile,
  onOpenSettings,
  isDarkTheme = false,
  onToggleTheme,
}) => {
  const navItems = [
    { id: 'unread' as const, label: 'Unread', icon: Inbox },
    { id: 'archive' as const, label: 'Archive', icon: Archive },
    { id: 'favorite' as const, label: 'Favorites', icon: Star },
    { id: 'all' as const, label: 'All Items', icon: BookOpen },
  ];

  const handleNavSelect = (action: () => void) => {
    action();
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 md:hidden animate-fade-in"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 md:static md:z-auto border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col h-screen select-none transition-transform duration-200 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand header */}
        <div className="p-5 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-sm">
              <BookmarkIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight text-neutral-900 dark:text-neutral-50 leading-none">
                Readeck
              </h1>
              <span className="text-[10px] font-medium text-teal-600 dark:text-teal-400">
                Powered by Bun
              </span>
            </div>
          </div>

          {/* Close button on mobile */}
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 md:hidden cursor-pointer"
            title="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Add action */}
        <div className="p-3">
          <button
            onClick={() => handleNavSelect(onOpenAddModal)}
            className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Save Bookmark</span>
          </button>
        </div>

        {/* Main Nav */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          <div className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider px-3 py-2">
            Collections
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentStatus === item.id && !selectedTag;
            return (
              <button
                key={item.id}
                onClick={() =>
                  handleNavSelect(() => {
                    onTagSelect(null);
                    onStatusChange(item.id);
                  })
                }
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400 font-semibold'
                    : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-teal-600 dark:text-teal-400' : ''}`} />
                <span>{item.label}</span>
              </button>
            );
          })}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="pt-4">
              <div className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider px-3 py-2">
                Tags
              </div>
              <div className="space-y-0.5">
                {tags.map((tag) => {
                  const isActive = selectedTag === tag.name;
                  return (
                    <button
                      key={tag.id}
                      onClick={() =>
                        handleNavSelect(() => onTagSelect(isActive ? null : tag.name))
                      }
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-sm transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400 font-semibold'
                          : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <TagIcon className="w-3.5 h-3.5 opacity-60" />
                        <span className="truncate">{tag.name}</span>
                      </div>
                      {tag.count !== undefined && (
                        <span className="text-xs text-neutral-400 dark:text-neutral-500 font-mono">
                          {tag.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </nav>

        {/* User info, theme toggle, settings & logout */}
        {user && (
          <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex flex-col min-w-0 pr-2">
                <span className="text-sm font-semibold truncate text-neutral-800 dark:text-neutral-200">
                  {user.username}
                </span>
                <span className="text-xs text-neutral-400 truncate">{user.email}</span>
              </div>

              <div className="flex items-center gap-0.5">
                {/* Theme toggle */}
                {onToggleTheme && (
                  <button
                    onClick={onToggleTheme}
                    title={isDarkTheme ? 'Switch to light mode' : 'Switch to dark mode'}
                    className="p-1.5 rounded-lg text-neutral-500 hover:text-teal-600 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                  >
                    {isDarkTheme ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </button>
                )}

                {/* Settings / Extension token */}
                {onOpenSettings && (
                  <button
                    onClick={() => handleNavSelect(onOpenSettings)}
                    title="Account & Extension Token"
                    className="p-1.5 rounded-lg text-neutral-500 hover:text-teal-600 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                  >
                    <SettingsIcon className="w-4 h-4" />
                  </button>
                )}

                {/* Logout */}
                <button
                  onClick={onLogout}
                  title="Log out"
                  className="p-1.5 rounded-lg text-neutral-500 hover:text-red-600 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
