"use client";

import { useState, useCallback } from "react";
import type { AnalyzeResponse } from "@/lib/types";
import AnalysisForm from "@/components/AnalysisForm";
import ProfileSummary from "@/components/ProfileSummary";
import AnalysisResult from "@/components/AnalysisResult";
import RepoList from "@/components/RepoList";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";

export default function Home() {
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastInput, setLastInput] = useState<string>("");

  const handleAnalyze = useCallback(async (input: string) => {
    setLastInput(input);
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "分析请求失败，请稍后重试");
        return;
      }

      setResult(data as AnalyzeResponse);
    } catch {
      setError("网络连接失败，请检查网络后重试");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRetry = useCallback(() => {
    if (lastInput) {
      handleAnalyze(lastInput);
    }
  }, [lastInput, handleAnalyze]);

  // 语言分布颜色
  const languageChartColors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-orange-500",
    "bg-cyan-500",
    "bg-pink-500",
    "bg-yellow-500",
    "bg-red-500",
  ];

  return (
    <main className="min-h-screen bg-gray-950">
      <div className="max-w-5xl mx-auto px-4 py-10 md:py-16">
        {/* 标题 */}
        <header className="text-center mb-10 md:mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            GitHub 个人分析
          </h1>
          <p className="text-gray-500 mt-3 text-base md:text-lg max-w-2xl mx-auto">
            输入 GitHub 主页，AI 自动分析开发者画像、技术栈、项目质量与职业竞争力
          </p>
        </header>

        {/* 搜索表单 */}
        <AnalysisForm onAnalyze={handleAnalyze} loading={loading} />

        {/* 加载状态 */}
        {loading && <LoadingState />}

        {/* 错误提示 */}
        {error && <ErrorState message={error} onRetry={handleRetry} />}

        {/* 分析结果 */}
        {result && (
          <>
            {/* 用户简介 */}
            {result.profile && (
              <ProfileSummary profile={result.profile} stats={result.stats} />
            )}

            {/* 语言分布 */}
            {result.stats && result.stats.topLanguages.length > 0 && (
              <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6 mb-6">
                <h3 className="text-white font-semibold mb-4">
                  语言分布
                </h3>
                <div className="space-y-3">
                  {result.stats.topLanguages.map((lang, i) => (
                    <div
                      key={lang.language}
                      className="flex items-center gap-3"
                    >
                      <span className="text-sm text-gray-300 w-24 md:w-32 truncate flex-shrink-0">
                        {lang.language}
                      </span>
                      <div className="flex-1 bg-gray-700/50 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            languageChartColors[i % languageChartColors.length]
                          }`}
                          style={{ width: `${lang.percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-12 text-right flex-shrink-0">
                        {lang.percentage}%
                      </span>
                      <span className="text-xs text-gray-600 w-8 text-right flex-shrink-0">
                        {lang.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI 分析结果 */}
            <AnalysisResult
              analysis={result.analysis}
              warning={result.warning}
            />

            {/* 仓库列表 */}
            {result.repositories && result.repositories.length > 0 && (
              <RepoList repositories={result.repositories} />
            )}
          </>
        )}

        {/* 初始空状态 */}
        {!loading && !error && !result && (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-blue-500/20">
              <svg
                className="w-8 h-8 text-blue-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <p className="text-gray-500 text-base">
              输入 GitHub 用户名或主页链接，开始分析
            </p>
            <p className="text-gray-600 text-sm mt-2">
              或者点击上方示例按钮快速体验
            </p>
          </div>
        )}

        {/* 底部 */}
        <footer className="text-center mt-12 pb-8">
          <p className="text-gray-700 text-xs">
            数据来源: GitHub API · AI 分析: DeepSeek
          </p>
        </footer>
      </div>
    </main>
  );
}
