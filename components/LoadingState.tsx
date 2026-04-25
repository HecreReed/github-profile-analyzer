"use client";

import { Loader2 } from "lucide-react";

export default function LoadingState() {
  return (
    <div className="space-y-6 mb-6">
      {/* 骨架屏 - 用户信息 */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 animate-pulse">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-gray-800 flex-shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="h-6 bg-gray-800 rounded w-48" />
            <div className="h-4 bg-gray-800 rounded w-32" />
            <div className="h-4 bg-gray-800 rounded w-full max-w-md" />
            <div className="flex gap-4">
              <div className="h-4 bg-gray-800 rounded w-24" />
              <div className="h-4 bg-gray-800 rounded w-24" />
              <div className="h-4 bg-gray-800 rounded w-32" />
            </div>
          </div>
        </div>
      </div>

      {/* 骨架屏 - 分析中 */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8">
        <div className="flex flex-col items-center gap-4 py-8">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          <p className="text-gray-400 text-sm">
            正在获取 GitHub 数据并分析...
          </p>
          <div className="flex gap-2 mt-2">
            <div className="h-2 w-16 bg-gray-800 rounded animate-pulse" />
            <div className="h-2 w-24 bg-gray-800 rounded animate-pulse" />
            <div className="h-2 w-20 bg-gray-800 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
