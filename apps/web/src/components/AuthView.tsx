import React, { useState } from 'react';
import { Bookmark as BookmarkIcon, Loader2, Eye, EyeOff } from 'lucide-react';
import { api } from '../api/client.ts';
import type { User } from '@readeck/shared';

interface AuthViewProps {
  onSuccess: (user: User) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim().length < 3) {
      setError('用户名长度至少需 3 个字符');
      return;
    }
    if (password.length < 6) {
      setError('密码长度至少需 6 个字符');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (isRegister) {
        const res = await api.register(username.trim(), email.trim(), password);
        onSuccess(res.user);
      } else {
        const res = await api.login(username.trim(), password);
        onSuccess(res.user);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '身份验证失败，请检查输入');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper-50 dark:bg-charcoal-950 p-4 select-none font-sans">
      <div className="bg-paper-100/50 dark:bg-charcoal-900 border border-paper-200 dark:border-charcoal-800 rounded-3xl w-full max-w-md p-8 sm:p-10 shadow-xl">
        {/* 顶部品牌 */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-charcoal-900 text-paper-50 dark:bg-paper-100 dark:text-charcoal-900 flex items-center justify-center shadow-md mb-4">
            <BookmarkIcon className="w-6 h-6 fill-current" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-charcoal-900 dark:text-paper-50 tracking-tight">
            Readeck
          </h1>
          <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mt-1.5 font-serif">
            {isRegister ? '开启专属的沉浸阅读之旅' : '欢迎回到属于你的阅读随笔馆'}
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-charcoal-700 dark:text-paper-300 mb-1.5">
              用户名
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              disabled={isLoading}
              className="w-full px-4 py-2.5 rounded-xl border border-paper-300 dark:border-charcoal-700 bg-paper-50/60 dark:bg-charcoal-800/60 text-sm focus:outline-hidden focus:ring-2 focus:ring-brand-500 text-charcoal-900 dark:text-paper-100 placeholder:text-charcoal-400"
            />
          </div>

          {isRegister && (
            <div>
              <label className="block text-xs font-medium text-charcoal-700 dark:text-paper-300 mb-1.5">
                电子邮箱
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                disabled={isLoading}
                className="w-full px-4 py-2.5 rounded-xl border border-paper-300 dark:border-charcoal-700 bg-paper-50/60 dark:bg-charcoal-800/60 text-sm focus:outline-hidden focus:ring-2 focus:ring-brand-500 text-charcoal-900 dark:text-paper-100 placeholder:text-charcoal-400"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-charcoal-700 dark:text-paper-300 mb-1.5">
              登录密码
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isLoading}
                className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-paper-300 dark:border-charcoal-700 bg-paper-50/60 dark:bg-charcoal-800/60 text-sm focus:outline-hidden focus:ring-2 focus:ring-brand-500 text-charcoal-900 dark:text-paper-100 placeholder:text-charcoal-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-charcoal-600 dark:hover:text-paper-200 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-2.5 px-4 bg-charcoal-900 hover:bg-charcoal-800 text-paper-50 dark:bg-paper-100 dark:hover:bg-white dark:text-charcoal-900 rounded-xl font-medium text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{isRegister ? '注册账号' : '立即登录'}</span>
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-charcoal-500 dark:text-charcoal-400">
          {isRegister ? (
            <span>
              已有账号？{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegister(false);
                  setError(null);
                }}
                className="text-brand-600 dark:text-brand-400 font-semibold hover:underline cursor-pointer"
              >
                返回登录
              </button>
            </span>
          ) : (
            <span>
              还没有账号？{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegister(true);
                  setError(null);
                }}
                className="text-brand-600 dark:text-brand-400 font-semibold hover:underline cursor-pointer"
              >
                创建新账号
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
