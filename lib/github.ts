import { GitHubUser, GitHubRepo, GitHubStats } from "./types";

const GITHUB_API_BASE = "https://api.github.com";

/** 获取 GitHub API 请求头（若配置 token 则携带） */
function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "github-profile-analyzer",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

/**
 * 解析用户输入，提取 GitHub 用户名
 * 支持格式：
 *   - "https://github.com/username"
 *   - "https://github.com/username/"
 *   - "username"
 */
export function parseUsername(input: string): string {
  const trimmed = input.trim();

  if (!trimmed) {
    throw new Error("请输入 GitHub 用户名或主页链接");
  }

  // 尝试解析为 URL
  try {
    const url = new URL(trimmed);
    const hostname = url.hostname.replace(/^www\./, "");

    if (hostname === "github.com") {
      const pathParts = url.pathname.replace(/^\/|\/$/g, "").split("/");
      const username = pathParts[0];

      if (!username) {
        throw new Error("无法从链接中解析用户名，请检查链接是否正确");
      }
      return username.toLowerCase();
    }

    throw new Error(
      "请输入有效的 GitHub 主页链接，例如：https://github.com/username"
    );
  } catch (e: unknown) {
    // 非 URL 则作为用户名处理
    if (e instanceof TypeError) {
      // 验证用户名格式：字母数字开头，可包含连字符
      if (/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(trimmed)) {
        return trimmed.toLowerCase();
      }
      throw new Error(
        "无效的输入格式。请输入 GitHub 用户名（如 octocat）或主页链接（如 https://github.com/octocat）"
      );
    }
    throw e;
  }
}

/** 获取 GitHub 用户基本信息 */
export async function fetchGitHubUser(username: string): Promise<GitHubUser> {
  const res = await fetch(`${GITHUB_API_BASE}/users/${encodeURIComponent(username)}`, {
    headers: getHeaders(),
  });

  if (res.status === 404) {
    throw new Error(`GitHub 用户 "${username}" 不存在`);
  }

  if (res.status === 403) {
    throw new Error(
      "GitHub API 访问频率受限。请稍后再试，或在环境变量中配置 GITHUB_TOKEN 以提升限制"
    );
  }

  if (!res.ok) {
    throw new Error(`GitHub API 请求失败（状态码: ${res.status}）`);
  }

  const data = await res.json();

  return {
    login: data.login,
    name: data.name,
    avatar_url: data.avatar_url,
    bio: data.bio,
    location: data.location,
    blog: data.blog,
    company: data.company,
    followers: data.followers,
    following: data.following,
    public_repos: data.public_repos,
    created_at: data.created_at,
    updated_at: data.updated_at,
    html_url: data.html_url,
  };
}

/** 获取 GitHub 用户公开仓库（最多 100 个，按更新时间排序） */
export async function fetchGitHubRepos(username: string): Promise<GitHubRepo[]> {
  const allRepos: GitHubRepo[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore && allRepos.length < 100) {
    const res = await fetch(
      `${GITHUB_API_BASE}/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=100&page=${page}&type=public`,
      { headers: getHeaders() }
    );

    if (res.status === 403) {
      throw new Error(
        "GitHub API 访问频率受限。请稍后再试，或在环境变量中配置 GITHUB_TOKEN 以提升限制"
      );
    }

    if (!res.ok) {
      throw new Error(`GitHub API 请求失败（状态码: ${res.status}）`);
    }

    const repos: any[] = await res.json();

    if (repos.length === 0) {
      hasMore = false;
    } else {
      const mapped = repos.map((r) => ({
        name: r.name,
        full_name: r.full_name,
        description: r.description,
        html_url: r.html_url,
        stargazers_count: r.stargazers_count,
        forks_count: r.forks_count,
        language: r.language,
        topics: r.topics || [],
        created_at: r.created_at,
        updated_at: r.updated_at,
        pushed_at: r.pushed_at,
        size: r.size,
        open_issues_count: r.open_issues_count,
      }));
      allRepos.push(...mapped);
      page++;
    }
  }

  return allRepos.slice(0, 100);
}

/** 基于用户和仓库数据计算基础统计信息 */
export function computeStats(user: GitHubUser, repos: GitHubRepo[]): GitHubStats {
  const totalStars = repos.reduce((sum, r) => sum + r.stargazers_count, 0);
  const totalForks = repos.reduce((sum, r) => sum + r.forks_count, 0);
  const averageStars = repos.length > 0 ? Math.round(totalStars / repos.length) : 0;

  // 语言分布统计
  const langCount = new Map<string, number>();
  repos.forEach((r) => {
    if (r.language) {
      langCount.set(r.language, (langCount.get(r.language) || 0) + 1);
    }
  });

  const totalLangs = [...langCount.values()].reduce((a, b) => a + b, 0);
  const topLanguages = Array.from(langCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([language, count]) => ({
      language,
      count,
      percentage: totalLangs > 0 ? Math.round((count / totalLangs) * 100) : 0,
    }));

  // 最受欢迎仓库 Top 5（按 star 数排序）
  const topRepos = [...repos]
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 5);

  // 最近活跃仓库 Top 5（按推送时间排序）
  const mostRecentRepos = [...repos]
    .sort((a, b) => new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime())
    .slice(0, 5);

  // 是否存在长期维护项目（创建超过 1 年且近期有更新）
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const hasLongTermProjects = repos.some(
    (r) => new Date(r.created_at) < oneYearAgo && new Date(r.pushed_at) > oneYearAgo
  );

  // 是否有近期活跃项目（3 个月内推送过）
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const hasRecentActivity = repos.some((r) => new Date(r.pushed_at) > threeMonthsAgo);

  // 技术栈关键词
  const techKeywords = new Set<string>();
  repos.forEach((r) => {
    if (r.language) techKeywords.add(r.language);
    r.topics.forEach((t) => {
      if (t.length > 2) techKeywords.add(t);
    });
  });

  return {
    totalStars,
    totalForks,
    totalRepos: repos.length,
    totalFollowers: user.followers,
    topLanguages,
    topRepos,
    mostRecentRepos,
    averageStars,
    hasLongTermProjects,
    hasRecentActivity,
    techKeywords: Array.from(techKeywords).slice(0, 20),
  };
}
