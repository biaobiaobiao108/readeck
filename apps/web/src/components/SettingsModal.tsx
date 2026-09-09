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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <h2 className="font-semibold text-lg text-neutral-900 dark:text-neutral-100">
              Account & Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* User info card */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/80">
            <div className="w-10 h-10 rounded-full bg-teal-600/10 dark:bg-teal-400/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold text-base">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">
                  {user.username}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 font-medium">
                  {user.group}
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                {user.email}
              </p>
            </div>
          </div>

          {/* Browser Extension Setup Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              <Key className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>Browser Extension Integration</span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Use these credentials to connect the official <strong>Readeck</strong> browser extension (Chrome, Firefox, Safari) for 1-click webpage saving.
            </p>

            {/* Server URL field */}
            <div>
              <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                Server URL
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={serverUrl}
                  className="flex-1 px-3 py-2 text-xs font-mono rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 select-all"
                />
                <button
                  onClick={handleCopyUrl}
                  className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedUrl ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* API Token field */}
            <div>
              <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                API Token
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  readOnly
                  value={currentToken}
                  className="flex-1 px-3 py-2 text-xs font-mono rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 select-all"
                />
                <button
                  onClick={handleCopyToken}
                  className="px-3 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  {copiedToken ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Token</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              Readeck Bun v1.0.0
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
