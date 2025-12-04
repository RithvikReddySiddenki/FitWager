"use client";

import { useEffect, useState } from "react";

interface TransactionModalProps {
  isOpen: boolean;
  type: "success" | "error" | "pending";
  title: string;
  message: string;
  txSignature?: string;
  onClose: () => void;
}

export function TransactionModal({
  isOpen,
  type,
  title,
  message,
  txSignature,
  onClose,
}: TransactionModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Auto-close success modals after 4 seconds
    if (type === "success" && isOpen) {
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [type, isOpen, onClose]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && type !== "pending") onClose();
    };
    
    if (isOpen) {
      window.addEventListener("keydown", handleEscape);
      // Prevent body scroll
      document.body.style.overflow = "hidden";
      return () => {
        window.removeEventListener("keydown", handleEscape);
        document.body.style.overflow = "";
      };
    }
  }, [isOpen, type, onClose]);

  if (!mounted || !isOpen) return null;

  const icons = {
    success: (
      <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    pending: (
      <svg className="w-8 h-8 text-violet-400 animate-spin" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    ),
  };

  const colors = {
    success: { bg: "bg-emerald-500/20", border: "border-emerald-500/30", title: "text-emerald-400" },
    error: { bg: "bg-red-500/20", border: "border-red-500/30", title: "text-red-400" },
    pending: { bg: "bg-violet-500/20", border: "border-violet-500/30", title: "text-violet-400" },
  };

  const c = colors[type];

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 animate-fade-in"
      onClick={type !== "pending" ? onClose : undefined}
    >
      <div
        className={`bg-[#1a1a24] border-t sm:border ${c.border} rounded-t-2xl sm:rounded-2xl p-6 w-full sm:max-w-sm sm:mx-4 animate-fade-in`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center">
          {/* Icon */}
          <div className={`w-16 h-16 rounded-full ${c.bg} flex items-center justify-center mb-4`}>
            {icons[type]}
          </div>

          {/* Title */}
          <h3 className={`text-lg font-semibold ${c.title} mb-2`}>{title}</h3>

          {/* Message */}
          <p className="text-gray-400 text-sm mb-4">{message}</p>

          {/* Transaction Link */}
          {txSignature && (
            <a
              href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-violet-400 mb-4"
            >
              View on Explorer
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}

          {/* Close Button */}
          {type !== "pending" && (
            <button
              onClick={onClose}
              className="btn btn-outline btn-block"
            >
              Close
            </button>
          )}

          {/* Pending Hint */}
          {type === "pending" && (
            <p className="text-xs text-gray-500">
              Confirm in your wallet...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
