"use client";

import { useEffect, useState } from "react";
import { useFitWagerStore } from "@/utils/store";

export function ToastContainer() {
  const [mounted, setMounted] = useState(false);
  const { toasts, removeToast } = useFitWagerStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const typeStyles = {
    success: {
      bg: "bg-emerald-500/15",
      border: "border-emerald-500/30",
      icon: (
        <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
    error: {
      bg: "bg-red-500/15",
      border: "border-red-500/30",
      icon: (
        <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
    },
    warning: {
      bg: "bg-amber-500/15",
      border: "border-amber-500/30",
      icon: (
        <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    info: {
      bg: "bg-blue-500/15",
      border: "border-blue-500/30",
      icon: (
        <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  };

  return (
    <div className="fixed top-20 left-4 right-4 sm:left-auto sm:right-4 sm:top-20 z-50 space-y-2 pointer-events-none sm:max-w-sm">
      {toasts.map((toast) => {
        const styles = typeStyles[toast.type];
        
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-xl px-4 py-3 backdrop-blur-lg border ${styles.bg} ${styles.border} shadow-lg animate-fade-in`}
          >
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                {styles.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{toast.message}</p>
                {toast.txSignature && (
                  <a
                    href={`https://explorer.solana.com/tx/${toast.txSignature}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-violet-400 mt-0.5 inline-block"
                  >
                    View tx →
                  </a>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 text-gray-500 hover:text-white transition p-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
