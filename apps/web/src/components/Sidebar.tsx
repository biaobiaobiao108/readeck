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
  Keyboard,
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
  onOpenShortcuts?: () => void;
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
  onOpenShortcuts,
}) => {
  const navItems = [
    { id: 'unread' as const, label: '稍后读', icon: Inbox },
    { id: 'archive' as const, label: '沉思归档', icon: Archive },
    { id: 'favorite' as const, label: '星标精选', icon: Star },
    { id: 'all' as const, label: '全部馆藏', icon: BookOpen },
  ];

  const handleNavSelect = (action: () => void) => {
    action();
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* 移动端遮罩层 */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-charcoal-950/40 backdrop-blur-xs z-40 md:hidden transition-opacity"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 md:static md:z-auto border-r border-paper-200/80 dark:border-charcoal-800 bg-paper-50 dark:bg-charcoal-900 flex flex-col h-screen select-none transition-transform duration-200 ease-in-out ${
          isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* 品牌顶部 */}
        <div className="p-5 flex items-center justify-between border-b border-paper-200/60 dark:border-charcoal-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-charcoal-900 text-paper-50 dark:bg-paper-100 dark:text-charcoal-900 flex items-center justify-center shadow-xs">
              <BookmarkIcon className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h1 className="font-serif font-bold text-lg tracking-tight text-charcoal-900 dark:text-paper-50 leading-none">
                Readeck
              </h1>
              <span className="text-[11px] text-charcoal-500 dark:text-charcoal-400 font-sans tracking-wider">
                极简阅读志
              </span>
            </div>
          </div>

          {/* 移动端关闭按钮 */}
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-charcoal-400 hover:text-charcoal-700 dark:hover:text-paper-200 md:hidden cursor-pointer"
            title="关闭侧边栏"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 快捷新建动作 */}
        <div className="p-3">
          <button
            onClick={() => handleNavSelect(onOpenAddModal)}
            className="w-full py-2.5 px-4 bg-charcoal-900 hover:bg-charcoal-800 text-paper-50 dark:bg-paper-100 dark:hover:bg-white dark:text-charcoal-900 rounded-xl font-medium text-sm flex items-center justify-center gap-2 shadow-xs transition-all duration-150 cursor-pointer active:scale-[0.99]"
          >
            <Plus className="w-4 h-4 stroke-[2.2]" />
            <span>添加文章</span>
          </button>
        </div>

        {/* 核心导航 */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto no-scrollbar">
          <div className="text-[11px] font-medium text-charcoal-400 dark:text-charcoal-500 tracking-wider px-3 py-1.5 uppercase font-sans">
            馆藏分类
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
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-paper-200/70 text-charcoal-900 dark:bg-charcoal-800 dark:text-paper-50 font-semibold shadow-2xs'
                    : 'text-charcoal-600 hover:bg-paper-100 dark:text-charcoal-300 dark:hover:bg-charcoal-800/50'
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive
                      ? 'text-brand-600 dark:text-brand-500'
                      : 'text-charcoal-400 dark:text-charcoal-500'
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}

          {/* 标签列表 */}
          {tags.length > 0 && (
            <div className="pt-5">
              <div className="text-[11px] font-medium text-charcoal-400 dark:text-charcoal-500 tracking-wider px-3 py-1.5 uppercase font-sans">
                标签体系
              </div>
              <div className="space-y-0.5 mt-1">
                {tags.map((tag) => {
                  const isActive = selectedTag === tag.name;
                  return (
                    <button
                      key={tag.id}
                      onClick={() =>
                        handleNavSelect(() => onTagSelect(isActive ? null : tag.name))
                      }
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-paper-200/70 text-charcoal-900 dark:bg-charcoal-800 dark:text-paper-50 font-medium'
                          : 'text-charcoal-600 hover:bg-paper-100 dark:text-charcoal-400 dark:hover:bg-charcoal-800/40'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <TagIcon className="w-3 h-3 text-charcoal-400 opacity-60" />
                        <span className="truncate">{tag.name}</span>
                      </div>
                      {tag.count !== undefined && (
                        <span className="text-[11px] text-charcoal-400 dark:text-charcoal-500 font-mono">
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

        {/* 底部用户信息与工具栏 */}
        {user && (
          <div className="p-3 border-t border-paper-200/80 dark:border-charcoal-800 bg-paper-100/50 dark:bg-charcoal-950/50 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0 pr-1">
                <div className="w-7 h-7 rounded-full bg-paper-300 dark:bg-charcoal-700 text-charcoal-800 dark:text-paper-100 flex items-center justify-center font-semibold text-xs flex-shrink-0">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold truncate text-charcoal-800 dark:text-paper-100 leading-tight">
                    {user.username}
                  </span>
                  <span className="text-[10px] text-charcoal-400 truncate leading-tight mt-0.5">
                    {user.email}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-0.5">
                {/* 快捷键提示 */}
                {onOpenShortcuts && (
                  <button
                    onClick={onOpenShortcuts}
                    title="键盘快捷键 (?)"
                    className="p-1.5 rounded-lg text-charcoal-400 hover:text-charcoal-700 hover:bg-paper-200/60 dark:hover:text-paper-100 dark:hover:bg-charcoal-800 transition-colors cursor-pointer"
                  >
                    <Keyboard className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* 主题切换 */}
                {onToggleTheme && (
                  <button
                    onClick={onToggleTheme}
                    title={isDarkTheme ? '切换至明亮纸质模式' : '切换至护眼夜墨模式'}
                    className="p-1.5 rounded-lg text-charcoal-400 hover:text-charcoal-700 hover:bg-paper-200/60 dark:hover:text-paper-100 dark:hover:bg-charcoal-800 transition-colors cursor-pointer"
                  >
                    {isDarkTheme ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                  </button>
                )}

                {/* 设置 */}
                {onOpenSettings && (
                  <button
                    onClick={() => handleNavSelect(onOpenSettings)}
                    title="账户与插件授权"
                    className="p-1.5 rounded-lg text-charcoal-400 hover:text-charcoal-700 hover:bg-paper-200/60 dark:hover:text-paper-100 dark:hover:bg-charcoal-800 transition-colors cursor-pointer"
                  >
                    <SettingsIcon className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* 退出登录 */}
                <button
                  onClick={onLogout}
                  title="退出登录"
                  className="p-1.5 rounded-lg text-charcoal-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
