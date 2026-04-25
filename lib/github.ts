import type {
  GitHubUser,
  GitHubRepo,
  GitHubStats,
  GitHubOrg,
  ContributionData,
} from "./types";

const GITHUB_API_BASE = "https://api.github.com";

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

/* ===== 用户名解析 ===== */

export function parseUsername(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) throw new Error("请输入 GitHub 用户名或主页链接");

  try {
    const url = new URL(trimmed);
    const hostname = url.hostname.replace(/^www\./, "");
    if (hostname === "github.com") {
      const pathParts = url.pathname.replace(/^\/|\/$/g, "").split("/");
      const username = pathParts[0];
      if (!username) throw new Error("无法从链接中解析用户名");
      return username.toLowerCase();
    }
    throw new Error("请输入有效的 GitHub 主页链接");
  } catch (e: unknown) {
    if (e instanceof TypeError) {
      if (/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(trimmed)) {
        return trimmed.toLowerCase();
      }
      throw new Error("无效的输入格式");
    }
    throw e;
  }
}

/* ===== GitHub REST API ===== */

export async function fetchGitHubUser(username: string): Promise<GitHubUser> {
  const res = await fetch(
    `${GITHUB_API_BASE}/users/${encodeURIComponent(username)}`,
    { headers: getHeaders() }
  );
  if (res.status === 404) throw new Error(`GitHub 用户 "${username}" 不存在`);
  if (res.status === 403)
    throw new Error("GitHub API 频率受限，请配置 GITHUB_TOKEN 或稍后再试");
  if (!res.ok) throw new Error(`GitHub API 请求失败（${res.status}）`);

  const d = await res.json();
  return {
    login: d.login,
    name: d.name,
    avatar_url: d.avatar_url,
    bio: d.bio,
    location: d.location,
    blog: d.blog,
    company: d.company,
    followers: d.followers,
    following: d.following,
    public_repos: d.public_repos,
    created_at: d.created_at,
    updated_at: d.updated_at,
    html_url: d.html_url,
  };
}

export async function fetchGitHubRepos(username: string): Promise<GitHubRepo[]> {
  const all: GitHubRepo[] = [];
  let page = 1;
  while (all.length < 100) {
    const res = await fetch(
      `${GITHUB_API_BASE}/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=100&page=${page}&type=public`,
      { headers: getHeaders() }
    );
    if (res.status === 403)
      throw new Error("GitHub API 频率受限");
    if (!res.ok) throw new Error(`GitHub API 请求失败（${res.status}）`);
    const repos = await res.json();
    if (repos.length === 0) break;
    all.push(
      ...repos.map((r: any) => ({
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
      }))
    );
    page++;
  }
  return all.slice(0, 100);
}

export async function fetchUserOrgs(username: string): Promise<GitHubOrg[]> {
  try {
    const res = await fetch(
      `${GITHUB_API_BASE}/users/${encodeURIComponent(username)}/orgs`,
      { headers: getHeaders() }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.map((o: any) => ({
      login: o.login,
      avatar_url: o.avatar_url,
      description: o.description,
    }));
  } catch {
    return [];
  }
}

/* ===== 贡献数据（优先 GraphQL → 回退 Events） ===== */

export async function fetchContributions(
  username: string
): Promise<ContributionData | null> {
  // 有 token 时走 GraphQL
  if (process.env.GITHUB_TOKEN) {
    try {
      return await fetchContributionsGraphQL(username);
    } catch {
      // fall through to events fallback
    }
  }
  // 无 token 时从 Events API 聚合
  return fetchContributionsFromEvents(username);
}

async function fetchContributionsGraphQL(
  username: string
): Promise<ContributionData> {
  const query = `
    query($login: String!) {
      user(login: $login) {
        contributionsCollection {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                date
                contributionCount
                color
              }
            }
          }
        }
      }
    }`;
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables: { login: username } }),
  });
  const json = await res.json();
  const cal = json?.data?.user?.contributionsCollection?.contributionCalendar;
  if (!cal) throw new Error("no contribution data");

  // color 格式如 "#0e4429"，转换成 level
  const levelMap: Record<string, number> = {};
  const colors = ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"];
  colors.forEach((c, i) => {
    levelMap[c.toLowerCase()] = i;
  });

  return {
    totalContributions: cal.totalContributions,
    weeks: cal.weeks.map((w: any) => ({
      days: w.contributionDays.map((d: any) => ({
        date: d.date,
        count: d.contributionCount,
        level: levelMap[d.color?.toLowerCase()] ?? Math.min(d.contributionCount, 4),
      })),
    })),
  };
}

async function fetchContributionsFromEvents(
  username: string
): Promise<ContributionData | null> {
  try {
    const res = await fetch(
      `${GITHUB_API_BASE}/users/${encodeURIComponent(username)}/events?per_page=100`,
      { headers: getHeaders() }
    );
    if (!res.ok) return null;
    const events: any[] = await res.json();

    // 按天聚合事件
    const dayMap = new Map<string, number>();
    events.forEach((e) => {
      const day = e.created_at?.slice(0, 10);
      if (day) dayMap.set(day, (dayMap.get(day) || 0) + 1);
    });

    // 生成最近 10 周的数据
    const weeks: ContributionData["weeks"] = [];
    const now = new Date();
    for (let w = 0; w < 10; w++) {
      const days: ContributionData["weeks"][number]["days"] = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(now);
        date.setDate(date.getDate() - (w * 7 + (6 - d)));
        const dateStr = date.toISOString().slice(0, 10);
        const count = dayMap.get(dateStr) || 0;
        days.push({
          date: dateStr,
          count,
          level: count === 0 ? 0 : count <= 2 ? 1 : count <= 5 ? 2 : count <= 10 ? 3 : 4,
        });
      }
      weeks.push({ days });
    }
    weeks.reverse();

    return {
      totalContributions: Array.from(dayMap.values()).reduce((a, b) => a + b, 0),
      weeks,
    };
  } catch {
    return null;
  }
}

/* ===== 统计计算 ===== */

export function computeStats(
  user: GitHubUser,
  repos: GitHubRepo[],
  orgs: GitHubOrg[] = []
): GitHubStats {
  const totalStars = repos.reduce((s, r) => s + r.stargazers_count, 0);
  const totalForks = repos.reduce((s, r) => s + r.forks_count, 0);
  const averageStars = repos.length > 0 ? Math.round(totalStars / repos.length) : 0;

  // 语言分布
  const langCount = new Map<string, number>();
  repos.forEach((r) => {
    if (r.language) langCount.set(r.language, (langCount.get(r.language) || 0) + 1);
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

  const topRepos = [...repos]
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 5);
  const mostRecentRepos = [...repos]
    .sort((a, b) => new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime())
    .slice(0, 5);

  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const hasLongTermProjects = repos.some(
    (r) => new Date(r.created_at) < oneYearAgo && new Date(r.pushed_at) > oneYearAgo
  );
  const hasRecentActivity = repos.some((r) => new Date(r.pushed_at) > threeMonthsAgo);

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
    orgs,
  };
}
