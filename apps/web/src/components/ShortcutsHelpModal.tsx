import React, { useEffect } from 'react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutsHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsHelpModal: React.FC<ShortcutsHelpModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shortcuts = [
    { key: 'J / K', desc: '在文章列表中下移 / 上移选择' },
    { key: 'Enter', desc: '打开当前选中的文章并进入阅读器' },
    { key: 'S', desc: '快速标星收藏 / 取消星标' },
    { key: 'E', desc: '快速归档 / 移回稍后读' },
    { key: '/', desc: '快速定位并聚焦搜索框' },
    { key: '?', desc: '打开 / 关闭本快捷键速查' },
    { key: 'Esc', desc: '返回列表或关闭当前弹窗' },
  ];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal-950/40 backdrop-blur-xs p-4 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-paper-50 dark:bg-charcoal-900 border border-paper-200 dark:border-charcoal-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-paper-200/80 dark:border-charcoal-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Keyboard className="w-5 h-5 text-brand-600 dark:text-brand-500" />
            <h3 className="font-serif font-semibold text-base text-charcoal-900 dark:text-paper-100">
              快捷键指南
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-charcoal-400 hover:text-charcoal-700 dark:hover:text-paper-200 hover:bg-paper-200/50 dark:hover:bg-charcoal-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 divide-y divide-paper-200/60 dark:divide-charcoal-800/60">
          {shortcuts.map((item) => (
            <div key={item.key} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
              <span className="text-charcoal-600 dark:text-charcoal-300">{item.desc}</span>
              <kbd className="px-2 py-1 rounded-md bg-paper-200/80 dark:bg-charcoal-800 text-charcoal-800 dark:text-paper-100 font-mono font-semibold border border-paper-300/80 dark:border-charcoal-700 shadow-2xs">
                {item.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="px-6 py-3 bg-paper-100/60 dark:bg-charcoal-950/40 border-t border-paper-200/60 dark:border-charcoal-800 text-[11px] text-charcoal-400 text-center">
          在文章阅读器中，也可随时按 <span className="font-mono font-semibold">S</span> 标星或 <span className="font-mono font-semibold">E</span> 归档
        </div>
      </div>
    </div>
  );
};
