'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import Button from '@/components/atoms/button';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  title?: string;
  message: string;
  variant?: ToastVariant;
  duration?: number; // ms
}

interface ToastContextValue {
  showToast: (toast: Omit<ToastItem, 'id'>) => string;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const generateId = () => Math.random().toString(36).substr(2, 9);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = generateId();
    const item: ToastItem = {
      id,
      title: toast.title,
      message: toast.message,
      variant: toast.variant || 'info',
      duration: toast.duration || 4000,
    };
    setToasts((prev) => [item, ...prev]);

    if (item.duration && item.duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, item.duration);
    }

    return id;
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col-reverse gap-3 items-end">
        {toasts.map((t) => (
          <Toast key={t.id} item={t} onClose={() => hideToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
};

function Toast({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  const colorMap: Record<ToastVariant, { bg: string; border: string; text: string }> = {
    success: { bg: 'bg-green-50 dark:bg-green-900/90', border: 'border-green-200 dark:border-green-400', text: 'text-green-700 dark:text-green-300' },
    error: { bg: 'bg-red-50 dark:bg-red-900/90', border: 'border-red-200 dark:border-red-800', text: 'text-red-700 dark:text-red-300' },
    info: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-700 dark:text-blue-300' },
    warning: { bg: 'bg-yellow-50 dark:bg-yellow-900/10', border: 'border-yellow-200 dark:border-yellow-800', text: 'text-yellow-700 dark:text-yellow-300' },
  };

  const variant = item.variant || 'info';
  const theme = colorMap[variant];

  return (
    <div className={`w-[320px] ${theme.bg} border ${theme.border} rounded-lg p-3 shadow-md`}> 
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          {item.title && <div className={`font-semibold ${theme.text} mb-1`}>{item.title}</div>}
          <div className={`text-sm ${theme.text}`}>{item.message}</div>
        </div>
        <div>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close toast">✕</Button>
        </div>
      </div>
    </div>
  );
}
