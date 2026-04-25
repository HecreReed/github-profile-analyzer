"use client";

import { AlertCircle } from "lucide-react";

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="bg-red-900/10 border border-red-800/30 rounded-2xl p-8 mb-6 text-center">
      <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-red-300 mb-2">
        分析出错了
      </h3>
      <p className="text-red-200/70 mb-6 max-w-md mx-auto">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-5 py-2.5 bg-red-600/20 text-red-300 border border-red-700/50 rounded-xl hover:bg-red-600/30 transition-all text-sm font-medium"
        >
          重新尝试
        </button>
      )}
    </div>
  );
}
