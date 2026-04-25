"use client";

import { useState } from "react";
import { Download, FileText, Check, Printer } from "lucide-react";
import type { AnalyzeResponse } from "@/lib/types";

interface Props {
  result: AnalyzeResponse;
}

function buildMarkdown(result: AnalyzeResponse): string {
  const { profile, stats, analysis } = result;
  const lines: string[] = [];

  lines.push(`# GitHub 个人分析报告：${profile.name || profile.login}`);
  lines.push("");
  lines.push(`> 生成时间：${new Date().toLocaleString("zh-CN")}`);
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("## 基本信息");
  lines.push("");
  lines.push(`- **用户名**：[@${profile.login}](${profile.html_url})`);
  lines.push(`- **姓名**：${profile.name || "未设置"}`);
  lines.push(`- **Bio**：${profile.bio || "未设置"}`);
  lines.push(`- **位置**：${profile.location || "未设置"}`);
  lines.push(`- **公司**：${profile.company || "未设置"}`);
  lines.push(`- **关注者**：${profile.followers}`);
  lines.push(`- **公开仓库**：${profile.public_repos}`);
  lines.push(`- **加入时间**：${new Date(profile.created_at).toLocaleDateString("zh-CN")}`);
  lines.push("");
  lines.push("## 统计数据");
  lines.push("");
  lines.push(`- **总 Star**：${stats.totalStars.toLocaleString()}`);
  lines.push(`- **总 Fork**：${stats.totalForks.toLocaleString()}`);
  lines.push(`- **平均 Star/仓库**：${stats.averageStars}`);
  lines.push(`- **近期活跃**：${stats.hasRecentActivity ? "是" : "否"}`);
  lines.push(`- **长期维护项目**：${stats.hasLongTermProjects ? "是" : "否"}`);
  lines.push("");
  lines.push("### 主要语言");
  lines.push("");
  stats.topLanguages.forEach((l) => {
    lines.push(`- ${l.language}：${l.count} 个仓库 (${l.percentage}%)`);
  });

  if (analysis) {
    lines.push("");
    lines.push("## AI 分析");
    lines.push("");
    lines.push(`> ${analysis.summary}`);
    lines.push("");
    lines.push("### 开发者类型");
    lines.push("");
    analysis.developerType.forEach((t) => lines.push(`- ${t}`));
    lines.push("");
    lines.push("### 综合评分");
    lines.push("");
    lines.push(`- **综合评分**：${analysis.scores.overall}/100`);
    lines.push(`- 技术深度：${analysis.scores.technicalDepth}/100`);
    lines.push(`- 项目完整度：${analysis.scores.projectCompleteness}/100`);
    lines.push(`- 开源影响力：${analysis.scores.openSourceInfluence}/100`);
    lines.push(`- 活跃度：${analysis.scores.activity}/100`);
    lines.push(`- 技术广度：${analysis.scores.technicalBreadth}/100`);
    lines.push(`- 职业吸引力：${analysis.scores.careerAttractiveness}/100`);
    lines.push("");
    lines.push("### 技术栈");
    lines.push("");
    lines.push(`- **主要语言**：${analysis.techStack.primaryLanguages.join("、")}`);
    lines.push(`- **框架工具**：${analysis.techStack.frameworks.join("、")}`);
    lines.push(`- **技术领域**：${analysis.techStack.domains.join("、")}`);
    lines.push("");
    lines.push("### 优势");
    lines.push("");
    analysis.strengths.forEach((s) => lines.push(`- ${s}`));
    lines.push("");
    lines.push("### 待改进");
    lines.push("");
    analysis.weaknesses.forEach((w) => lines.push(`- ${w}`));

    if (analysis.careerAdvice.suitableRoles.length > 0) {
      lines.push("");
      lines.push("### 适合岗位");
      lines.push("");
      analysis.careerAdvice.suitableRoles.forEach((r) => lines.push(`- ${r}`));
    }

    if (analysis.careerAdvice.resumeTips.length > 0) {
      lines.push("");
      lines.push("### 简历建议");
      lines.push("");
      analysis.careerAdvice.resumeTips.forEach((t) => lines.push(`- ${t}`));
    }

    if (analysis.careerAdvice.growthSuggestions.length > 0) {
      lines.push("");
      lines.push("### 成长建议");
      lines.push("");
      analysis.careerAdvice.growthSuggestions.forEach((s) => lines.push(`- ${s}`));
    }
  }

  lines.push("");
  lines.push("---");
  lines.push(`> 由 [GitHub 个人分析](https://github.com/HecreReed/github-profile-analyzer) 生成`);
  return lines.join("\n");
}

export default function ExportButton({ result }: Props) {
  const [copied, setCopied] = useState(false);

  const copyMarkdown = () => {
    const md = buildMarkdown(result);
    navigator.clipboard.writeText(md).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={copyMarkdown}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs text-gray-300 hover:bg-gray-700 transition-colors"
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5 text-green-400" /> 已复制
          </>
        ) : (
          <>
            <FileText className="w-3.5 h-3.5" /> 导出 Markdown
          </>
        )}
      </button>
      <button
        onClick={() => window.print()}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs text-gray-300 hover:bg-gray-700 transition-colors"
      >
        <Printer className="w-3.5 h-3.5" /> 打印/PDF
      </button>
    </div>
  );
}
