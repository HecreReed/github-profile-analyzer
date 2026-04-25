"use client";

interface ScoreGaugeProps {
  score: number;
  maxScore?: number;
  size?: number;
}

function getScoreColor(score: number): string {
  if (score >= 85) return "#22c55e"; // 绿
  if (score >= 70) return "#3b82f6"; // 蓝
  if (score >= 55) return "#f59e0b"; // 黄
  return "#ef4444"; // 红
}

function getScoreLabel(score: number): string {
  if (score >= 85) return "优秀";
  if (score >= 70) return "良好";
  if (score >= 55) return "一般";
  return "待提升";
}

export default function ScoreGauge({
  score,
  maxScore = 100,
  size = 160,
}: ScoreGaugeProps) {
  const percentage = score / maxScore;
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - percentage);
  const color = getScoreColor(score);
  const label = getScoreLabel(score);

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        {/* 背景圆环 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1f2937"
          strokeWidth={10}
        />
        {/* 进度圆环 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-4xl font-bold text-white" style={{ color }}>
          {score}
        </span>
        <span className="text-xs text-gray-500">/ {maxScore}</span>
        <span className="text-sm font-medium mt-0.5" style={{ color }}>
          {label}
        </span>
      </div>
    </div>
  );
}
