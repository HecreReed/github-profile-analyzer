"use client";

import { useMemo } from "react";
import type { ContributionData } from "@/lib/types";
import { GitCommit } from "lucide-react";

interface Props {
  data: ContributionData | null;
  username: string;
}

const LEVEL_COLORS = ["#1f2937", "#0e4429", "#006d32", "#26a641", "#39d353"];

function getMonthLabels(weeks: ContributionData["weeks"]): { label: string; index: number }[] {
  const labels: { label: string; index: number }[] = [];
  let lastMonth = -1;
  weeks.forEach((w, wi) => {
    const firstDay = w.days.find((d) => d.date);
    if (!firstDay) return;
    const month = new Date(firstDay.date).getMonth();
    if (month !== lastMonth) {
      labels.push({
        label: ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"][month],
        index: wi,
      });
      lastMonth = month;
    }
  });
  return labels;
}

export default function ContributionHeatmap({ data, username }: Props) {
  const monthLabels = useMemo(
    () => (data ? getMonthLabels(data.weeks) : []),
    [data]
  );

  if (!data || data.weeks.length === 0) {
    return (
      <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <GitCommit className="w-4 h-4 text-green-400" />
          <h3 className="text-white font-semibold">贡献日历</h3>
        </div>
        <p className="text-gray-500 text-sm">
          无法获取 {username} 的贡献数据。
          {!process.env.GITHUB_TOKEN && (
            <span className="block mt-1">
              配置 GITHUB_TOKEN 环境变量可获取完整贡献日历
            </span>
          )}
        </p>
      </div>
    );
  }

  const cellSize = 13;
  const cellGap = 3;
  const dayW = cellSize + cellGap;
  const height = 7 * dayW;
  const totalDays = data.weeks.reduce((s, w) => s + w.days.length, 0);
  const maxCount = Math.max(
    ...data.weeks.flatMap((w) => w.days.map((d) => d.count)),
    1
  );

  return (
    <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6 mb-6 overflow-x-auto">
      <div className="flex items-center gap-2 mb-4">
        <GitCommit className="w-4 h-4 text-green-400" />
        <h3 className="text-white font-semibold">贡献日历</h3>
        <span className="text-gray-500 text-sm ml-2">
          共 {data.totalContributions.toLocaleString()} 次贡献（{totalDays} 天）
        </span>
      </div>

      <div className="relative" style={{ minWidth: data.weeks.length * dayW + 40 }}>
        {/* 月份标签 */}
        <svg width={data.weeks.length * dayW + 30} height={height + 24}>
          {monthLabels.map((m) => (
            <text
              key={m.index}
              x={m.index * dayW + 2}
              y={12}
              fill="#6b7280"
              fontSize={10}
            >
              {m.label}
            </text>
          ))}

          {/* 星期标签 */}
          {["一", "三", "五"].map((d, i) => (
            <text
              key={d}
              x={2}
              y={24 + (i * 2 + 1) * dayW + 8}
              fill="#6b7280"
              fontSize={10}
            >
              {d}
            </text>
          ))}

          {/* 格子 */}
          {data.weeks.map((week, wi) =>
            week.days.map((day, di) => {
              const intensity =
                maxCount > 0
                  ? Math.round((day.count / maxCount) * 4)
                  : 0;
              return (
                <rect
                  key={`${wi}-${di}`}
                  x={wi * dayW + 30}
                  y={di * dayW + 18}
                  width={cellSize}
                  height={cellSize}
                  rx={2}
                  fill={LEVEL_COLORS[intensity]}
                >
                  <title>
                    {day.date}: {day.count} 次贡献
                  </title>
                </rect>
              );
            })
          )}
        </svg>

        {/* 图例 */}
        <div className="flex items-center gap-1.5 mt-2 ml-[30px]">
          <span className="text-xs text-gray-500 mr-1">少</span>
          {LEVEL_COLORS.map((c, i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: c }}
            />
          ))}
          <span className="text-xs text-gray-500 ml-1">多</span>
        </div>
      </div>
    </div>
  );
}
