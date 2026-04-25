"use client";

import { GitHubUser, GitHubStats } from "@/lib/types";
import {
  MapPin,
  Building2,
  Link as LinkIcon,
  Calendar,
  Users,
  GitFork,
  Star,
  BookOpen,
} from "lucide-react";

interface ProfileSummaryProps {
  profile: GitHubUser;
  stats: GitHubStats;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function ProfileSummary({ profile, stats }: ProfileSummaryProps) {
  return (
    <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6 mb-6 backdrop-blur-sm">
      <div className="flex flex-col md:flex-row gap-6">
        {/* 头像 */}
        <div className="flex-shrink-0">
          <img
            src={profile.avatar_url}
            alt={profile.login}
            className="w-24 h-24 md:w-28 md:h-28 rounded-full border-2 border-gray-700 ring-2 ring-blue-500/20"
          />
        </div>

        {/* 信息 */}
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold text-white">
            {profile.name || profile.login}
          </h2>
          <a
            href={profile.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-blue-400 transition-colors"
          >
            @{profile.login}
          </a>

          {profile.bio && (
            <p className="text-gray-300 mt-2 leading-relaxed">{profile.bio}</p>
          )}

          <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-400">
            {profile.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-gray-500" />
                {profile.location}
              </span>
            )}
            {profile.company && (
              <span className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-gray-500" />
                {profile.company}
              </span>
            )}
            {profile.blog && (
              <span className="flex items-center gap-1.5">
                <LinkIcon className="w-4 h-4 text-gray-500" />
                <a
                  href={
                    profile.blog.startsWith("http")
                      ? profile.blog
                      : `https://${profile.blog}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline truncate max-w-[200px]"
                >
                  {profile.blog}
                </a>
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-gray-500" />
              {formatDate(profile.created_at)}
            </span>
          </div>
        </div>
      </div>

      {/* 统计数字 */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-6 pt-6 border-t border-gray-800">
        <StatItem
          icon={Users}
          label="关注者"
          value={profile.followers}
        />
        <StatItem
          icon={BookOpen}
          label="公开仓库"
          value={stats.totalRepos}
        />
        <StatItem icon={Star} label="总 Star" value={stats.totalStars} />
        <StatItem icon={GitFork} label="总 Fork" value={stats.totalForks} />
        <StatItem icon={Star} label="平均 Star" value={stats.averageStars} />
      </div>
    </div>
  );
}

function StatItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="text-center p-3 bg-gray-800/40 rounded-xl">
      <Icon className="w-5 h-5 text-blue-400 mx-auto mb-1" />
      <div className="text-xl font-bold text-white">
        {value.toLocaleString()}
      </div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}
