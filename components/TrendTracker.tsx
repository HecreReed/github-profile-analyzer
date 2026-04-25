"use client";

import { useState, useEffect } from "react";
import type { AnalysisScores } from "@/lib/types";
import { TrendingUp, Clock, Trash2, BarChart3 } from "lucide-react";

const STORAGE_KEY = "github-analyzer-history";

interface SavedRecord {
  id: string;
  username: string;
  timestamp: string;
  avatarUrl: string;
  name: string;
  scores: AnalysisScores;
}

function loadHistory(): SavedRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(records: SavedRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    // ignore
  }
}

export function saveAnalysisToHistory(
  username: string,
  avatarUrl: string,
  name: string,
  scores: AnalysisScores
) {
  const records = loadHistory();
  // 避免对同一用户在同一天重复记录
  const today = new Date().toISOString().slice(0, 10);
  const existing = records.find(
    (r) => r.username === username && r.timestamp.slice(0, 10) === today
  );
  if (existing) {
    existing.scores = scores;
    existing.avatarUrl = avatarUrl;
    existing.name = name;
  } else {
    records.unshift({
      id: `${username}-${Date.now()}`,
      username,
      timestamp: new Date().toISOString(),
      avatarUrl,
      name,
      scores,
    });
  }
  // 最多保留 50 条
  saveHistory(records.slice(0, 50));
}

interface TrendTrackerProps {
  currentUsername?: string;
}

export default function TrendTracker({ currentUsername }: TrendTrackerProps) {
  const [records, setRecords] = useState<SavedRecord[]>([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    setRecords(loadHistory());
  }, []);

  const filtered = showAll
    ? records
    : records.filter((r) => r.username === currentUsername);
  const display = filtered.slice(0, 20);

  const clearHistory = () => {
    saveHistory([]);
    setRecords([]);
  };

  // 趋势数据（当前用户的所有记录）
  const userTrends = records
    .filter((r) => r.username === currentUsername)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return (
    <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <h3 className="text-white font-semibold">历史趋势</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            {showAll ? "只看当前用户" : "显示全部"}
          </button>
          {records.length > 0 && (
            <button
              onClick={clearHistory}
              className="text-xs text-gray-600 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {display.length === 0 ? (
        <p className="text-gray-500 text-sm py-4 text-center">
          暂无历史记录，分析完成后自动保存
        </p>
      ) : (
        <>
          {/* 趋势图 */}
          {userTrends.length >= 2 && (
            <div className="mb-5 bg-gray-800/40 rounded-xl p-4">
              <div className="flex items-center gap-1.5 mb-3">
                <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs text-gray-400">
                  {currentUsername} 的综合评分趋势
                </span>
              </div>
              <div className="flex items-end gap-1.5 h-24">
                {userTrends.map((r, i) => {
                  const maxScore = Math.max(
                    ...userTrends.map((t) => t.scores.overall),
                    100
                  );
                  const height =
                    (r.scores.overall / maxScore) * 100;
                  return (
                    <div
                      key={r.id}
                      className="flex-1 flex flex-col items-center gap-1"
                    >
                      <span className="text-[10px] text-gray-500">
                        {r.scores.overall}
                      </span>
                      <div
                        className="w-full rounded-t-sm bg-gradient-to-t from-blue-600 to-blue-400 min-h-[4px]"
                        style={{ height: `${Math.max(height, 2)}%` }}
                      />
                      <span className="text-[9px] text-gray-600">
                        {new Date(r.timestamp).toLocaleDateString("zh-CN", {
                          month: "2-digit",
                          day: "2-digit",
                        })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 历史列表 */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {display.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-3 bg-gray-800/30 rounded-lg px-3 py-2"
              >
                <img
                  src={r.avatarUrl}
                  alt=""
                  className="w-6 h-6 rounded-full"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-gray-300">
                    {r.name || r.username}
                  </span>
                  <span className="text-xs text-gray-600 ml-2">
                    @{r.username}
                  </span>
                </div>
                <span
                  className={`text-sm font-bold ${
                    r.scores.overall >= 70
                      ? "text-green-400"
                      : r.scores.overall >= 50
                        ? "text-yellow-400"
                        : "text-red-400"
                  }`}
                >
                  {r.scores.overall}
                </span>
                <span className="text-[10px] text-gray-600 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(r.timestamp).toLocaleDateString("zh-CN")}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
