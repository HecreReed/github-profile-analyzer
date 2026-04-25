"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { AnalyzeResponse, DeepSeekConfig } from "@/lib/types";
import AnalysisForm from "@/components/AnalysisForm";
import ProfileSummary from "@/components/ProfileSummary";
import AnalysisResult from "@/components/AnalysisResult";
import RepoList from "@/components/RepoList";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import DeepSeekPanel from "@/components/DeepSeekPanel";
import ContributionHeatmap from "@/components/ContributionHeatmap";
import CompareView from "@/components/CompareView";
import ChatPanel from "@/components/ChatPanel";
import TrendTracker, { saveAnalysisToHistory } from "@/components/TrendTracker";
import ExportButton from "@/components/ExportButton";
import {
  User,
  GitCommit,
  Users,
  MessageSquare,
  TrendingUp,
} from "lucide-react";

type Tab = "profile" | "heatmap" | "compare" | "chat" | "history";

const TABS: { key: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "profile", label: "分析报告", icon: User },
  { key: "heatmap", label: "贡献日历", icon: GitCommit },
  { key: "compare", label: "用户对比", icon: Users },
  { key: "chat", label: "对话追问", icon: MessageSquare },
  { key: "history", label: "历史趋势", icon: TrendingUp },
];

export default function Home() {
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastInput, setLastInput] = useState<string>("");
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [hasHistory, setHasHistory] = useState(false);
  const deepseekConfigRef = useRef<DeepSeekConfig | null>(null);

  // 初始化时检查是否有历史记录
  useEffect(() => {
    try {
      const raw = localStorage.getItem("github-analyzer-history");
      if (raw) {
        const records = JSON.parse(raw);
        setHasHistory(Array.isArray(records) && records.length > 0);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleConfigChange = useCallback((config: DeepSeekConfig) => {
    deepseekConfigRef.current = config;
  }, []);

  const handleAnalyze = useCallback(
    async (input: string) => {
      setLastInput(input);
      setLoading(true);
      setError(null);
      setResult(null);
      setActiveTab("profile");

      try {
        const body: Record<string, unknown> = { input };
        const cfg = deepseekConfigRef.current;
        if (cfg?.apiKey) body.config = cfg;

        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "分析请求失败");
          return;
        }

        const response = data as AnalyzeResponse;
        setResult(response);

        // 保存到历史趋势
        if (response.analysis?.scores) {
          saveAnalysisToHistory(
            response.profile.login,
            response.profile.avatar_url,
            response.profile.name || response.profile.login,
            response.analysis.scores
          );
          setHasHistory(true);
        }
      } catch {
        setError("网络连接失败，请检查网络后重试");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleRetry = useCallback(() => {
    if (lastInput) handleAnalyze(lastInput);
  }, [lastInput, handleAnalyze]);

  const languageChartColors = [
    "bg-blue-500", "bg-green-500", "bg-purple-500",
    "bg-orange-500", "bg-cyan-500", "bg-pink-500",
    "bg-yellow-500", "bg-red-500",
  ];

  return (
    <main className="min-h-screen bg-gray-950">
      <div className="max-w-5xl mx-auto px-4 py-10 md:py-16">
        {/* 标题 */}
        <header className="text-center mb-8 md:mb-10">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            GitHub 个人分析
          </h1>
          <p className="text-gray-500 mt-3 text-base md:text-lg max-w-2xl mx-auto">
            输入 GitHub 主页，AI 自动分析开发者画像、技术栈、项目质量与职业竞争力
          </p>
        </header>

        {/* API 配置 */}
        <DeepSeekPanel onConfigChange={handleConfigChange} />

        {/* 搜索表单 */}
        <AnalysisForm onAnalyze={handleAnalyze} loading={loading} />

        {/* 加载状态 */}
        {loading && <LoadingState />}

        {/* 错误提示 */}
        {error && <ErrorState message={error} onRetry={handleRetry} />}

        {/* 分析结果 - 标签页 */}
        {result && !loading && (
          <>
            {/* 标签导航 */}
            <div className="flex gap-1 mb-6 overflow-x-auto pb-1 border-b border-gray-800">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isDisabled =
                  (tab.key === "chat" && !result.analysis) ||
                  (tab.key === "heatmap" && !result.contributionData);

                if (tab.key === "history" && !hasHistory) return null;

                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    disabled={isDisabled}
                    className={`flex items-center gap-1.5 px-4 py-2.5 text-sm rounded-t-lg transition-all whitespace-nowrap ${
                      activeTab === tab.key
                        ? "text-blue-300 bg-blue-500/5 border-b-2 border-blue-500 -mb-px"
                        : isDisabled
                          ? "text-gray-700 cursor-not-allowed"
                          : "text-gray-500 hover:text-gray-300 hover:bg-gray-800/30"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Profile Tab */}
            {activeTab === "profile" && (
              <>
                {/* 导出按钮 */}
                <div className="flex justify-end mb-3">
                  <ExportButton result={result} />
                </div>

                <ProfileSummary
                  profile={result.profile}
                  stats={result.stats}
                />

                {/* 语言分布 */}
                {result.stats.topLanguages.length > 0 && (
                  <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6 mb-6">
                    <h3 className="text-white font-semibold mb-4">语言分布</h3>
                    <div className="space-y-3">
                      {result.stats.topLanguages.map((lang, i) => (
                        <div key={lang.language} className="flex items-center gap-3">
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

                {/* 参与的组织 */}
                {result.stats.orgs && result.stats.orgs.length > 0 && (
                  <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6 mb-6">
                    <h3 className="text-white font-semibold mb-3">参与的组织</h3>
                    <div className="flex flex-wrap gap-3">
                      {result.stats.orgs.map((org) => (
                        <div
                          key={org.login}
                          className="flex items-center gap-2 bg-gray-800/40 rounded-lg px-3 py-2"
                        >
                          <img
                            src={org.avatar_url}
                            alt={org.login}
                            className="w-6 h-6 rounded-full"
                          />
                          <span className="text-sm text-gray-300">
                            {org.login}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <AnalysisResult
                  analysis={result.analysis}
                  warning={result.warning}
                />

                <RepoList
                  repositories={result.repositories}
                  config={deepseekConfigRef.current}
                />
              </>
            )}

            {/* Heatmap Tab */}
            {activeTab === "heatmap" && (
              <ContributionHeatmap
                data={result.contributionData ?? null}
                username={result.profile.login}
              />
            )}

            {/* Compare Tab */}
            {activeTab === "compare" && (
              <CompareView config={deepseekConfigRef.current} />
            )}

            {/* Chat Tab */}
            {activeTab === "chat" && result.analysis && (
              <ChatPanel
                profile={result.profile}
                stats={result.stats}
                analysis={result.analysis}
                config={deepseekConfigRef.current}
              />
            )}

            {/* History Tab */}
            {activeTab === "history" && (
              <TrendTracker currentUsername={result.profile.login} />
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
