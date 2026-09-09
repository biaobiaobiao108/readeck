import React, { useState } from 'react';
import { X, Copy, Check, Key, ShieldCheck, User as UserIcon } from 'lucide-react';
import type { User } from '@readeck/shared';
import { api } from '../api/client.ts';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, user }) => {
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  if (!isOpen) return null;

  const currentToken = api.getToken() || '';
  const serverUrl = window.location.origin;

  const handleCopyToken = async () => {
    if (!currentToken) return;
    await navigator.clipboard.writeText(currentToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(serverUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal-950/40 backdrop-blur-xs p-4 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-paper-50 dark:bg-charcoal-900 border border-paper-200 dark:border-charcoal-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden font-sans"
      >
        {/* 头部 */}
        <div className="px-6 py-4 border-b border-paper-200/80 dark:border-charcoal-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-400 flex items-center justify-center">
              <UserIcon className="w-4 h-4" />
            </div>
            <h2 className="font-serif font-bold text-lg text-charcoal-900 dark:text-paper-100">
              账户与扩展设置
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-charcoal-400 hover:text-charcoal-700 dark:hover:text-paper-200 hover:bg-paper-200/50 dark:hover:bg-charcoal-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 用户信息卡片 */}
          <div className="flex items-center gap-3.5 p-4 rounded-xl bg-paper-100/60 dark:bg-charcoal-800/50 border border-paper-200 dark:border-charcoal-700/80">
            <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 flex items-center justify-center font-bold text-base">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-charcoal-900 dark:text-paper-100 text-sm">
                  {user.username}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-paper-200 dark:bg-charcoal-700 text-charcoal-600 dark:text-paper-300 font-medium">
                  {user.group === 'admin' ? '管理员' : '普通用户'}
                </span>
              </div>
              <p className="text-xs text-charcoal-400 truncate mt-0.5">
                {user.email}
              </p>
            </div>
          </div>

          {/* 浏览器扩展关联说明 */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-charcoal-700 dark:text-paper-300">
              <Key className="w-3.5 h-3.5 text-brand-600 dark:text-brand-500" />
              <span>浏览器扩展连接凭证</span>
            </div>
            <p className="text-xs text-charcoal-500 dark:text-charcoal-400 leading-relaxed">
              将下列服务地址与 API Token 填入 <strong>Readeck</strong> 浏览器剪藏扩展（Chrome / Edge / Firefox / Safari），即可在浏览网页时一键采集文章至此。
            </p>

            {/* 服务器地址 */}
            <div>
              <label className="block text-[11px] font-medium text-charcoal-600 dark:text-paper-400 mb-1">
                服务端地址 (Server URL)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={serverUrl}
                  className="flex-1 px-3 py-2 text-xs font-mono rounded-xl border border-paper-300 dark:border-charcoal-700 bg-paper-100/40 dark:bg-charcoal-800/60 text-charcoal-800 dark:text-paper-200 select-all"
                />
                <button
                  onClick={handleCopyUrl}
                  className="px-3 py-2 rounded-xl border border-paper-300 dark:border-charcoal-700 hover:bg-paper-200/60 dark:hover:bg-charcoal-800 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer text-charcoal-700 dark:text-paper-200"
                >
                  {copiedUrl ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                      <span>已复制</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>复制地址</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* API Token */}
            <div>
              <label className="block text-[11px] font-medium text-charcoal-600 dark:text-paper-400 mb-1">
                授权密钥 (API Token)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  readOnly
                  value={currentToken}
                  className="flex-1 px-3 py-2 text-xs font-mono rounded-xl border border-paper-300 dark:border-charcoal-700 bg-paper-100/40 dark:bg-charcoal-800/60 text-charcoal-800 dark:text-paper-200 select-all"
                />
                <button
                  onClick={handleCopyToken}
                  className="px-3.5 py-2 rounded-xl bg-charcoal-900 hover:bg-charcoal-800 text-paper-50 dark:bg-paper-100 dark:hover:bg-white dark:text-charcoal-900 text-xs font-medium flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  {copiedToken ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-brand-500" />
                      <span>已复制</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>复制 Token</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-paper-200/80 dark:border-charcoal-800 flex items-center justify-between text-xs text-charcoal-400">
            <span className="flex items-center gap-1 text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
              Readeck 极简阅读志
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-paper-200/60 hover:bg-paper-200 dark:bg-charcoal-800 dark:hover:bg-charcoal-700 text-charcoal-700 dark:text-paper-300 text-xs font-medium rounded-xl transition-colors cursor-pointer"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
