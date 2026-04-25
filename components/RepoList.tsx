"use client";

import { GitHubRepo } from "@/lib/types";
import { Star, GitFork, ExternalLink, Clock } from "lucide-react";

interface RepoListProps {
  repositories: GitHubRepo[];
}

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f7df1e",
  Python: "#3572A5",
  Go: "#00ADD8",
  Rust: "#dea584",
  Java: "#b07219",
  "C++": "#f34b7d",
  C: "#555555",
  "C#": "#178600",
  Ruby: "#701516",
  PHP: "#4F5D95",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Dart: "#00B4AB",
  Shell: "#89e051",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Scala: "#c22d40",
  Lua: "#000080",
  Vue: "#41b883",
};

function getLanguageColor(language: string | null): string {
  if (!language) return "#6b7280";
  return LANGUAGE_COLORS[language] || "#6b7280";
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "今天";
  if (diffDays === 1) return "昨天";
  if (diffDays < 30) return `${diffDays} 天前`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} 个月前`;
  return `${Math.floor(diffDays / 365)} 年前`;
}

export default function RepoList({ repositories }: RepoListProps) {
  // 按 star 数降序排列，取 top 10
  const topRepos = [...repositories]
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 10);

  if (topRepos.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6 mb-6">
      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
        <Star className="w-4 h-4 text-yellow-400" />
        热门仓库 Top {topRepos.length}
      </h3>

      <div className="space-y-3">
        {topRepos.map((repo) => (
          <div
            key={repo.full_name}
            className="bg-gray-800/40 rounded-xl p-4 border border-gray-800 hover:border-gray-700 transition-all"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                {/* 仓库名 */}
                <a
                  href={repo.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-300 font-mono text-sm font-medium hover:text-blue-200 transition-colors flex items-center gap-1.5"
                >
                  {repo.full_name}
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>

                {/* 描述 */}
                {repo.description && (
                  <p className="text-gray-400 text-sm mt-1 leading-relaxed line-clamp-2">
                    {repo.description}
                  </p>
                )}

                {/* 标签 */}
                <div className="flex flex-wrap items-center gap-3 mt-2.5">
                  {/* 语言 */}
                  {repo.language && (
                    <span className="flex items-center gap-1.5 text-xs text-gray-500">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{
                          backgroundColor: getLanguageColor(repo.language),
                        }}
                      />
                      {repo.language}
                    </span>
                  )}

                  {/* Stars */}
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Star className="w-3.5 h-3.5" />
                    {repo.stargazers_count.toLocaleString()}
                  </span>

                  {/* Forks */}
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <GitFork className="w-3.5 h-3.5" />
                    {repo.forks_count.toLocaleString()}
                  </span>

                  {/* 最后更新 */}
                  <span className="flex items-center gap-1 text-xs text-gray-600">
                    <Clock className="w-3 h-3" />
                    {formatDate(repo.pushed_at)}
                  </span>
                </div>

                {/* Topics */}
                {repo.topics.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {repo.topics.slice(0, 5).map((topic) => (
                      <span
                        key={topic}
                        className="px-2 py-0.5 bg-blue-500/8 text-blue-400 rounded text-xs border border-blue-500/15"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
