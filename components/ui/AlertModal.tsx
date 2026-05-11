"use client";

import { X, AlertTriangle, Info, CheckCircle2 } from "lucide-react";

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  type?: 'info' | 'warning' | 'error' | 'success';
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
}

export function AlertModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  type = 'info',
  confirmText = 'OK',
  cancelText = 'Cancel',
  showCancel = false
}: AlertModalProps) {
  if (!isOpen) return null;

  const icons = {
    info: <Info className="w-10 h-10 text-indigo-500" />,
    warning: <AlertTriangle className="w-10 h-10 text-amber-500" />,
    error: <X className="w-10 h-10 text-rose-500" />,
    success: <CheckCircle2 className="w-10 h-10 text-emerald-500" />,
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 flex flex-col items-center text-center">
          <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
            {icons[type]}
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">{title}</h3>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed">{message}</p>
        </div>
        
        <div className="p-4 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex gap-3">
          {showCancel && (
            <button 
              onClick={onClose}
              className="flex-1 px-4 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors"
            >
              {cancelText}
            </button>
          )}
          <button 
            onClick={() => {
              if (onConfirm) onConfirm();
              onClose();
            }}
            className={`flex-1 px-4 py-3 text-white rounded-2xl text-sm font-bold shadow-lg transition-all active:scale-95
              ${type === 'error' ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20' : ''}
              ${type === 'warning' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' : ''}
              ${type === 'success' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20' : ''}
              ${type === 'info' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20' : ''}
            `}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
