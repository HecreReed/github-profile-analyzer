"use client";

import { useState, useCallback } from "react";
import type { AnalyzeResponse, DeepSeekConfig } from "@/lib/types";
import { Users, Plus, X, Star, GitFork, BookOpen, Activity } from "lucide-react";

interface CompareViewProps {
  config: DeepSeekConfig | null;
}

interface CompareEntry {
  input: string;
  result: AnalyzeResponse | null;
  error: string | null;
  loading: boolean;
}

export default function CompareView({ config }: CompareViewProps) {
  const [entries, setEntries] = useState<CompareEntry[]>([
    { input: "", result: null, error: null, loading: false },
    { input: "", result: null, error: null, loading: false },
  ]);

  const addEntry = () => {
    if (entries.length < 4) {
      setEntries([...entries, { input: "", result: null, error: null, loading: false }]);
    }
  };

  const removeEntry = (idx: number) => {
    setEntries(entries.filter((_, i) => i !== idx));
  };

  const updateInput = (idx: number, value: string) => {
    const next = [...entries];
    next[idx] = { ...next[idx], input: value };
    setEntries(next);
  };

  const analyzeOne = useCallback(
    async (idx: number) => {
      const entry = entries[idx];
      if (!entry.input.trim()) return;

      const next = [...entries];
      next[idx] = { ...entry, loading: true, error: null, result: null };
      setEntries(next);

      try {
        const body: Record<string, unknown> = { input: entry.input };
        if (config?.apiKey) body.config = config;

        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();

        if (!res.ok) {
          next[idx] = { ...next[idx], loading: false, error: data.error || "分析失败" };
        } else {
          next[idx] = { ...next[idx], loading: false, result: data };
        }
      } catch {
        next[idx] = { ...next[idx], loading: false, error: "网络请求失败" };
      }
      setEntries([...next]);
    },
    [entries, config]
  );

  const analyzeAll = () => {
    entries.forEach((_, i) => {
      if (entries[i].input.trim() && !entries[i].loading && !entries[i].result) {
        analyzeOne(i);
      }
    });
  };

  const finished = entries.filter((e) => e.result?.analysis?.scores);
  const canCompare = finished.length >= 2;

  return (
    <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6 mb-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-400" />
          <h3 className="text-white font-semibold">多用户对比</h3>
        </div>
        <div className="flex items-center gap-2">
          {entries.length < 4 && (
            <button
              onClick={addEntry}
              className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> 添加
            </button>
          )}
          {entries.some((e) => e.input.trim() && !e.result && !e.loading) && (
            <button
              onClick={analyzeAll}
              className="px-3 py-1.5 bg-blue-600/20 text-blue-300 border border-blue-500/30 rounded-lg text-sm hover:bg-blue-600/30 transition-colors"
            >
              全部分析
            </button>
          )}
        </div>
      </div>

      {/* 输入行 */}
      <div className="space-y-2 mb-4">
        {entries.map((entry, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-5 flex-shrink-0">
              #{i + 1}
            </span>
            <input
              type="text"
              value={entry.input}
              onChange={(e) => updateInput(i, e.target.value)}
              placeholder="GitHub 用户名..."
              disabled={entry.loading}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
            <button
              onClick={() => analyzeOne(i)}
              disabled={!entry.input.trim() || entry.loading || !!entry.result}
              className="px-3 py-2 bg-blue-600/20 text-blue-300 border border-blue-500/30 rounded-lg text-xs hover:bg-blue-600/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              {entry.loading ? "..." : "分析"}
            </button>
            {entries.length > 2 && (
              <button
                onClick={() => removeEntry(i)}
                className="text-gray-600 hover:text-red-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* 对比结果 */}
      {canCompare && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left text-gray-500 font-medium py-2 pr-4 w-32">
                  指标
                </th>
                {finished.map((e, i) => (
                  <th key={i} className="text-center py-2 px-3">
                    <div className="flex flex-col items-center">
                      <img
                        src={e.result?.profile?.avatar_url}
                        alt={e.result?.profile?.login}
                        className="w-8 h-8 rounded-full mb-1"
                      />
                      <span className="text-white text-xs font-medium">
                        {e.result?.profile?.login}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {/* 综合评分 */}
              <tr>
                <td className="text-gray-400 py-2.5 pr-4">综合评分</td>
                {finished.map((e, i) => (
                  <td key={i} className="text-center py-2.5">
                    <span
                      className={`text-lg font-bold ${
                        (e.result?.analysis?.scores?.overall ?? 0) >= 70
                          ? "text-green-400"
                          : (e.result?.analysis?.scores?.overall ?? 0) >= 50
                            ? "text-yellow-400"
                            : "text-red-400"
                      }`}
                    >
                      {e.result?.analysis?.scores?.overall ?? "-"}
                    </span>
                  </td>
                ))}
              </tr>
              {/* 各维度 */}
              {[
                { key: "technicalDepth" as const, label: "技术深度" },
                { key: "projectCompleteness" as const, label: "项目完整度" },
                { key: "openSourceInfluence" as const, label: "开源影响力" },
                { key: "activity" as const, label: "活跃度" },
                { key: "technicalBreadth" as const, label: "技术广度" },
                { key: "careerAttractiveness" as const, label: "职业吸引力" },
              ].map((dim) => (
                <tr key={dim.key}>
                  <td className="text-gray-400 py-2 pr-4">{dim.label}</td>
                  {finished.map((e, i) => {
                    const s = e.result?.analysis?.scores?.[dim.key] ?? 0;
                    return (
                      <td key={i} className="text-center py-2">
                        <div className="flex items-center gap-1.5 justify-center">
                          <div className="w-16 bg-gray-700/50 rounded-full h-2">
                            <div
                              className="h-2 rounded-full bg-blue-500"
                              style={{ width: `${s}%` }}
                            />
                          </div>
                          <span className="text-gray-300 text-xs w-5">{s}</span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
              {/* 统计数字 */}
              <tr>
                <td className="text-gray-400 py-2 pr-4">Star</td>
                {finished.map((e, i) => (
                  <td key={i} className="text-center text-gray-300 py-2">
                    {e.result?.stats?.totalStars?.toLocaleString() ?? "-"}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="text-gray-400 py-2 pr-4">Fork</td>
                {finished.map((e, i) => (
                  <td key={i} className="text-center text-gray-300 py-2">
                    {e.result?.stats?.totalForks?.toLocaleString() ?? "-"}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="text-gray-400 py-2 pr-4">仓库数</td>
                {finished.map((e, i) => (
                  <td key={i} className="text-center text-gray-300 py-2">
                    {e.result?.stats?.totalRepos ?? "-"}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="text-gray-400 py-2 pr-4">开发者类型</td>
                {finished.map((e, i) => (
                  <td key={i} className="text-center py-2">
                    <span className="text-xs text-blue-300">
                      {e.result?.analysis?.developerType?.[0] || "-"}
                    </span>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="text-gray-400 py-2 pr-4">主要语言</td>
                {finished.map((e, i) => (
                  <td key={i} className="text-center py-2">
                    <span className="text-xs text-gray-400">
                      {e.result?.stats?.topLanguages
                        ?.slice(0, 2)
                        .map((l) => l.language)
                        .join(", ") || "-"}
                    </span>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>

          {/* 雷达图（用简单的条形替代） */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {finished.map((e, i) => (
              <div
                key={i}
                className="bg-gray-800/40 rounded-xl p-4 border border-gray-800"
              >
                <div className="flex items-center gap-2 mb-3">
                  <img
                    src={e.result?.profile?.avatar_url}
                    alt=""
                    className="w-5 h-5 rounded-full"
                  />
                  <span className="text-white text-sm font-medium">
                    {e.result?.profile?.login}
                  </span>
                </div>
                <div className="space-y-2">
                  {[
                    {
                      key: "technicalDepth",
                      label: "深度",
                      color: "bg-blue-500",
                    },
                    {
                      key: "projectCompleteness",
                      label: "完整",
                      color: "bg-emerald-500",
                    },
                    {
                      key: "openSourceInfluence",
                      label: "影响",
                      color: "bg-purple-500",
                    },
                    { key: "activity", label: "活跃", color: "bg-orange-500" },
                    {
                      key: "technicalBreadth",
                      label: "广度",
                      color: "bg-cyan-500",
                    },
                    {
                      key: "careerAttractiveness",
                      label: "职业",
                      color: "bg-pink-500",
                    },
                  ].map((dim) => {
                    const s =
                      e.result?.analysis?.scores?.[
                        dim.key as keyof typeof e.result.analysis.scores
                      ] ?? 0;
                    return (
                      <div
                        key={dim.key}
                        className="flex items-center gap-2"
                      >
                        <span className="text-xs text-gray-500 w-8">
                          {dim.label}
                        </span>
                        <div className="flex-1 bg-gray-700/50 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${dim.color}`}
                            style={{ width: `${s}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400 w-5 text-right">
                          {s}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {entries.some((e) => e.error) && (
        <div className="mt-4 space-y-1">
          {entries.map(
            (e, i) =>
              e.error && (
                <p key={i} className="text-red-400 text-xs">
                  #{i + 1}: {e.error}
                </p>
              )
          )}
        </div>
      )}

      {!canCompare && entries.some((e) => e.result) && (
        <p className="text-gray-500 text-sm text-center py-4">
          至少分析 2 位用户才能显示对比结果
        </p>
      )}
    </div>
  );
}
