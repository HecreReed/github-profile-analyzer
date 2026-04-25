"use client";

import { DeepSeekAnalysis } from "@/lib/types";
import ScoreGauge from "./ScoreGauge";
import {
  Award,
  TrendingUp,
  Code,
  Briefcase,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  BarChart3,
  Activity,
  Tag,
  ExternalLink,
  Star,
} from "lucide-react";

interface AnalysisResultProps {
  analysis: DeepSeekAnalysis | null;
  warning?: string;
}

const SCORE_ITEMS = [
  { key: "technicalDepth" as const, label: "技术深度", icon: Code, color: "bg-blue-500" },
  { key: "projectCompleteness" as const, label: "项目完整度", icon: Award, color: "bg-emerald-500" },
  { key: "openSourceInfluence" as const, label: "开源影响力", icon: TrendingUp, color: "bg-purple-500" },
  { key: "activity" as const, label: "活跃度", icon: Activity, color: "bg-orange-500" },
  { key: "technicalBreadth" as const, label: "技术广度", icon: BarChart3, color: "bg-cyan-500" },
  { key: "careerAttractiveness" as const, label: "职业吸引力", icon: Briefcase, color: "bg-pink-500" },
];

function ScoreBar({ label, score, icon: Icon, color }: {
  label: string;
  score: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <div className="bg-gray-800/40 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-gray-400" />
          <span className="text-gray-300 text-sm">{label}</span>
        </div>
        <span className="text-white font-bold text-lg">{score}</span>
      </div>
      <div className="w-full bg-gray-700/50 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

export default function AnalysisResult({ analysis, warning }: AnalysisResultProps) {
  if (warning && !analysis) {
    return (
      <div className="bg-yellow-900/15 border border-yellow-700/40 rounded-2xl p-6 mb-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-yellow-300 font-semibold text-base">部分数据不可用</h3>
            <p className="text-yellow-200/60 mt-1 text-sm">{warning}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div className="space-y-6 mb-6">
      {/* 一句话总结 */}
      <div className="bg-gradient-to-r from-blue-900/30 via-purple-900/20 to-gray-900 border border-blue-800/40 rounded-2xl p-6">
        <p className="text-lg text-gray-200 leading-relaxed">
          {analysis.summary}
        </p>
      </div>

      {/* 综合评分 + 开发者类型 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 综合评分 */}
        <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6 flex flex-col items-center justify-center">
          <ScoreGauge score={analysis.scores.overall} />
          <p className="text-gray-400 mt-3 text-sm font-medium">综合评分</p>
        </div>

        {/* 开发者类型 + 技术栈 */}
        <div className="md:col-span-2 bg-gray-900/80 border border-gray-800 rounded-2xl p-6">
          {/* 开发者类型 */}
          {analysis.developerType.length > 0 && (
            <div className="mb-5">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Tag className="w-4 h-4 text-blue-400" />
                开发者类型
              </h3>
              <div className="flex flex-wrap gap-2">
                {analysis.developerType.map((type) => (
                  <span
                    key={type}
                    className="px-3 py-1.5 bg-blue-500/10 text-blue-300 border border-blue-500/25 rounded-lg text-sm font-medium"
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 主要语言 */}
          {analysis.techStack.primaryLanguages.length > 0 && (
            <div className="mb-3">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Code className="w-4 h-4 text-green-400" />
                技术栈
              </h3>
              <div className="flex flex-wrap gap-2">
                {analysis.techStack.primaryLanguages.map((lang) => (
                  <span
                    key={lang}
                    className="px-3 py-1.5 bg-green-500/10 text-green-300 border border-green-500/25 rounded-lg text-sm"
                  >
                    {lang}
                  </span>
                ))}
                {analysis.techStack.frameworks.map((fw) => (
                  <span
                    key={fw}
                    className="px-3 py-1.5 bg-purple-500/10 text-purple-300 border border-purple-500/25 rounded-lg text-sm"
                  >
                    {fw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 技术领域 */}
          {analysis.techStack.domains.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {analysis.techStack.domains.map((domain) => (
                <span
                  key={domain}
                  className="px-2 py-1 bg-gray-800 text-gray-400 rounded-md text-xs"
                >
                  {domain}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 详细评分 */}
      {analysis.scores && (
        <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            详细评分
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {SCORE_ITEMS.map((item) => (
              <ScoreBar
                key={item.key}
                label={item.label}
                score={analysis.scores[item.key]}
                icon={item.icon}
                color={item.color}
              />
            ))}
          </div>
        </div>
      )}

      {/* 优势与待改进 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {analysis.strengths.length > 0 && (
          <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              优势
            </h3>
            <ul className="space-y-2">
              {analysis.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-gray-300 text-sm leading-relaxed">
                  <span className="text-green-400 mt-1.5 flex-shrink-0">•</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}
        {analysis.weaknesses.length > 0 && (
          <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              待改进
            </h3>
            <ul className="space-y-2">
              {analysis.weaknesses.map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-gray-300 text-sm leading-relaxed">
                  <span className="text-yellow-400 mt-1.5 flex-shrink-0">•</span>
                  {w}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 代表项目 */}
      {analysis.representativeProjects.length > 0 && (
        <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-400" />
            代表项目
          </h3>
          <div className="space-y-3">
            {analysis.representativeProjects.map((p, i) => (
              <div
                key={i}
                className="bg-gray-800/40 rounded-xl p-4 border border-gray-800"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-blue-300 font-mono text-sm font-medium">
                    {p.name}
                  </span>
                </div>
                <p className="text-gray-400 text-sm">{p.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 活跃度分析 */}
      {analysis.activityAnalysis && (
        <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-orange-400" />
            活跃度分析
          </h3>
          <p className="text-gray-300 text-sm leading-relaxed">
            {analysis.activityAnalysis}
          </p>
        </div>
      )}

      {/* 职业发展建议 */}
      {analysis.careerAdvice && (
        <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-yellow-400" />
            职业发展建议
          </h3>

          {analysis.careerAdvice.suitableRoles.length > 0 && (
            <div className="mb-5">
              <h4 className="text-gray-400 text-xs uppercase tracking-wider mb-2">
                适合岗位
              </h4>
              <div className="flex flex-wrap gap-2">
                {analysis.careerAdvice.suitableRoles.map((role) => (
                  <span
                    key={role}
                    className="px-3 py-1.5 bg-blue-500/10 text-blue-300 border border-blue-500/25 rounded-lg text-sm"
                  >
                    {role}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analysis.careerAdvice.resumeTips.length > 0 && (
              <AdviceSection
                title="简历包装建议"
                items={analysis.careerAdvice.resumeTips}
                color="blue"
              />
            )}
            {analysis.careerAdvice.githubOptimizationTips.length > 0 && (
              <AdviceSection
                title="GitHub 主页优化"
                items={analysis.careerAdvice.githubOptimizationTips}
                color="purple"
              />
            )}
            {analysis.careerAdvice.growthSuggestions.length > 0 && (
              <AdviceSection
                title="技术成长建议"
                items={analysis.careerAdvice.growthSuggestions}
                color="green"
                className="md:col-span-2"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AdviceSection({
  title,
  items,
  color,
  className,
}: {
  title: string;
  items: string[];
  color: "blue" | "purple" | "green";
  className?: string;
}) {
  const dotColor = {
    blue: "text-blue-400",
    purple: "text-purple-400",
    green: "text-green-400",
  }[color];

  return (
    <div className={className}>
      <h4 className="text-gray-400 text-xs uppercase tracking-wider mb-2">
        {title}
      </h4>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li
            key={i}
            className="text-gray-300 text-sm flex items-start gap-2 leading-relaxed"
          >
            <span className={`${dotColor} mt-1 flex-shrink-0`}>•</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
