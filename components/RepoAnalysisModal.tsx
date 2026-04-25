"use client";

import { useState } from "react";
import { X, Loader2, Code, Lightbulb, AlertTriangle, CheckCircle, ExternalLink, Bot } from "lucide-react";
import type { GitHubRepo, DeepSeekConfig, RepoDeepAnalysis } from "@/lib/types";

interface Props {
  repo: GitHubRepo;
  config: DeepSeekConfig | null;
  onClose: () => void;
}

export default function RepoAnalysisModal({ repo, config, onClose }: Props) {
  const [analysis, setAnalysis] = useState<RepoDeepAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        username: repo.full_name.split("/")[0],
        repo,
      };
      if (config?.apiKey) body.config = config;

      const res = await fetch("/api/analyze-repo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "分析失败");
      } else {
        setAnalysis(data.analysis);
      }
    } catch {
      setError("网络请求失败");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <div>
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Code className="w-4 h-4 text-blue-400" />
              仓库深度分析
            </h3>
            <p className="text-blue-300 font-mono text-sm mt-0.5">
              {repo.full_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-5">
          {/* 仓库基本信息 */}
          <div className="flex flex-wrap gap-3 text-xs text-gray-400 mb-4 bg-gray-800/40 rounded-xl p-3">
            <span>⭐ {repo.stargazers_count} Stars</span>
            <span>⑂ {repo.forks_count} Forks</span>
            {repo.language && <span>🔤 {repo.language}</span>}
            <span>📦 {repo.size} KB</span>
          </div>

          {!analysis && !loading && !error && (
            <div className="text-center py-8">
              <Bot className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 text-sm mb-1">
                让 AI 分析这个仓库的架构、代码质量和工程实践
              </p>
              <p className="text-gray-600 text-xs mb-4">
                基于仓库元数据进行评估
              </p>
              <button
                onClick={startAnalysis}
                className="px-5 py-2.5 bg-blue-600/20 text-blue-300 border border-blue-500/30 rounded-xl text-sm hover:bg-blue-600/30 transition-colors"
              >
                开始分析
              </button>
              <p className="text-gray-600 text-xs mt-2">
                需要配置 DeepSeek API Key
              </p>
            </div>
          )}

          {loading && (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-3" />
              <p className="text-gray-400 text-sm">AI 分析中...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
              <p className="text-red-300 text-sm mb-3">{error}</p>
              <button
                onClick={startAnalysis}
                className="px-4 py-2 bg-red-600/20 text-red-300 border border-red-700/50 rounded-lg text-sm"
              >
                重试
              </button>
            </div>
          )}

          {analysis && (
            <div className="space-y-4">
              {/* 总结 */}
              <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-800/30 rounded-xl p-4">
                <p className="text-gray-200 text-sm leading-relaxed">
                  {analysis.summary}
                </p>
              </div>

              {/* 架构 */}
              <div>
                <h4 className="text-white text-sm font-medium mb-2 flex items-center gap-1.5">
                  <Code className="w-4 h-4 text-purple-400" />
                  架构分析
                </h4>
                <p className="text-gray-400 text-sm leading-relaxed bg-gray-800/30 rounded-xl p-3">
                  {analysis.architecture}
                </p>
              </div>

              {/* 代码质量 */}
              <div>
                <h4 className="text-white text-sm font-medium mb-2 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  代码质量
                </h4>
                <p className="text-gray-400 text-sm leading-relaxed bg-gray-800/30 rounded-xl p-3">
                  {analysis.codeQuality}
                </p>
              </div>

              {/* 可维护性 */}
              {analysis.maintainability && (
                <div>
                  <h4 className="text-white text-sm font-medium mb-2 flex items-center gap-1.5">
                    <Lightbulb className="w-4 h-4 text-yellow-400" />
                    可维护性
                  </h4>
                  <p className="text-gray-400 text-sm leading-relaxed bg-gray-800/30 rounded-xl p-3">
                    {analysis.maintainability}
                  </p>
                </div>
              )}

              {/* 优势 */}
              {analysis.strengths.length > 0 && (
                <div>
                  <h4 className="text-white text-sm font-medium mb-2">优势</h4>
                  <ul className="space-y-1">
                    {analysis.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                        <span className="text-green-400 mt-1">•</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 改进建议 */}
              {analysis.suggestions.length > 0 && (
                <div>
                  <h4 className="text-white text-sm font-medium mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-yellow-400" />
                    改进建议
                  </h4>
                  <ul className="space-y-1">
                    {analysis.suggestions.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                        <span className="text-yellow-400 mt-1">•</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 技术决策 */}
              {analysis.techDecisions.length > 0 && (
                <div>
                  <h4 className="text-white text-sm font-medium mb-2">技术选型评价</h4>
                  <ul className="space-y-1">
                    {analysis.techDecisions.map((d, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                        <span className="text-blue-400 mt-1">•</span>
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
