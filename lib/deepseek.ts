import { DeepSeekAnalysis, GitHubUser, GitHubRepo, GitHubStats } from "./types";

const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

/** 检查 DeepSeek 配置是否完整 */
export function checkDeepSeekConfig(): void {
  if (!DEEPSEEK_API_KEY) {
    throw new Error("DEEPSEEK_API_KEY 未配置");
  }
}

/**
 * 构建 DeepSeek 分析 Prompt
 * 包含用户资料、仓库列表、统计信息，要求模型返回结构化 JSON
 */
function buildPrompt(user: GitHubUser, repos: GitHubRepo[], stats: GitHubStats): string {
  const topReposInfo = stats.topRepos
    .map(
      (r, i) =>
        `${i + 1}. ${r.full_name} | Stars: ${r.stargazers_count} | Forks: ${r.forks_count} | Language: ${r.language || "N/A"} | Topics: ${r.topics.join(", ") || "无"} | 描述: ${r.description || "无描述"}`
    )
    .join("\n");

  const recentReposInfo = stats.mostRecentRepos
    .map((r, i) => `${i + 1}. ${r.full_name} | 最近推送: ${r.pushed_at} | Stars: ${r.stargazers_count}`)
    .join("\n");

  const languagesInfo = stats.topLanguages
    .map((l) => `- ${l.language}: ${l.count} 个仓库 (${l.percentage}%)`)
    .join("\n");

  return `You are a professional GitHub profile analyst. Analyze the following developer data and return structured JSON.

## User Profile
- Username: ${user.login}
- Display Name: ${user.name || "N/A"}
- Bio: ${user.bio || "N/A"}
- Location: ${user.location || "N/A"}
- Company: ${user.company || "N/A"}
- Followers: ${user.followers}
- Following: ${user.following}
- Public Repos: ${user.public_repos}
- Account Created: ${user.created_at}

## Statistics
- Total Stars: ${stats.totalStars}
- Total Forks: ${stats.totalForks}
- Average Stars/Repo: ${stats.averageStars}
- Has Long-term Projects: ${stats.hasLongTermProjects}
- Has Recent Activity: ${stats.hasRecentActivity}

## Language Distribution
${languagesInfo || "- 无语言数据"}

## Top Repositories (by stars)
${topReposInfo || "- 无仓库数据"}

## Recently Active Repositories
${recentReposInfo || "- 无仓库数据"}

## All Languages Used
${[...new Set(repos.map((r) => r.language).filter(Boolean))].join(", ") || "未知"}

## All Topics
${[...new Set(repos.flatMap((r) => r.topics))].join(", ") || "无"}

## Response Rules
Return ONLY a valid JSON object. NO markdown, NO code blocks, NO explanation, NO extra text.

Required JSON structure:
{
  "summary": "One-sentence summary in Chinese describing this developer",
  "developerType": ["Array of developer type labels in Chinese, e.g. 全栈工程师, 后端工程师, 前端工程师, AI/ML 工程师, 系统/底层工程师, DevOps/云原生工程师, 开源维护者, 学习型开发者, 研究型开发者"],
  "scores": {
    "overall": number 0-100,
    "technicalDepth": number 0-100,
    "projectCompleteness": number 0-100,
    "openSourceInfluence": number 0-100,
    "activity": number 0-100,
    "technicalBreadth": number 0-100,
    "careerAttractiveness": number 0-100
  },
  "techStack": {
    "primaryLanguages": ["Array of main programming languages"],
    "frameworks": ["Array of frameworks and tools"],
    "domains": ["Array of technical domains in Chinese"]
  },
  "strengths": ["Array of strengths in Chinese"],
  "weaknesses": ["Array of areas for improvement in Chinese"],
  "representativeProjects": [
    {"name": "repo-name", "reason": "Why this project stands out in Chinese"}
  ],
  "activityAnalysis": "Detailed activity analysis in Chinese",
  "careerAdvice": {
    "suitableRoles": ["Array of suitable job roles in Chinese"],
    "resumeTips": ["Array of resume suggestions in Chinese"],
    "githubOptimizationTips": ["Array of GitHub profile tips in Chinese"],
    "growthSuggestions": ["Array of growth suggestions in Chinese"]
  }
}

## Important Guidelines
- Be objective and honest. Do NOT inflate scores.
- A user with few repos or low activity should receive appropriately low scores.
- Base ALL analysis strictly on the data provided. Do NOT fabricate or assume information.
- If data is insufficient, acknowledge limitations.
- Scores must be reasonable: overall should reflect the weighted average of sub-scores.
- Career advice must be specific, actionable, and relevant to their actual tech stack.`;
}

/** 尝试从 DeepSeek 响应文本中解析 JSON */
function tryParseDeepSeekResponse(text: string): DeepSeekAnalysis | null {
  // 直接解析
  try {
    return JSON.parse(text);
  } catch {
    // 尝试从文本中提取 JSON 对象
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

/** 验证并补全 DeepSeek 返回的分析数据 */
function validateAnalysis(data: Record<string, unknown>): DeepSeekAnalysis {
  const scores = data.scores as Record<string, unknown> | undefined;
  const techStack = data.techStack as Record<string, unknown> | undefined;
  const careerAdvice = data.careerAdvice as Record<string, unknown> | undefined;

  return {
    summary: typeof data.summary === "string" ? data.summary : "未能生成总结",
    developerType: Array.isArray(data.developerType) ? data.developerType.map(String) : ["未分类"],
    scores: {
      overall: clampScore(scores?.overall),
      technicalDepth: clampScore(scores?.technicalDepth),
      projectCompleteness: clampScore(scores?.projectCompleteness),
      openSourceInfluence: clampScore(scores?.openSourceInfluence),
      activity: clampScore(scores?.activity),
      technicalBreadth: clampScore(scores?.technicalBreadth),
      careerAttractiveness: clampScore(scores?.careerAttractiveness),
    },
    techStack: {
      primaryLanguages: Array.isArray(techStack?.primaryLanguages) ? techStack.primaryLanguages.map(String) : [],
      frameworks: Array.isArray(techStack?.frameworks) ? techStack.frameworks.map(String) : [],
      domains: Array.isArray(techStack?.domains) ? techStack.domains.map(String) : [],
    },
    strengths: Array.isArray(data.strengths) ? data.strengths.map(String) : [],
    weaknesses: Array.isArray(data.weaknesses) ? data.weaknesses.map(String) : [],
    representativeProjects: Array.isArray(data.representativeProjects)
      ? data.representativeProjects.map((p: unknown) => ({
          name: String((p as Record<string, unknown>).name || ""),
          reason: String((p as Record<string, unknown>).reason || ""),
        }))
      : [],
    activityAnalysis: typeof data.activityAnalysis === "string" ? data.activityAnalysis : "无活跃度分析数据",
    careerAdvice: {
      suitableRoles: Array.isArray(careerAdvice?.suitableRoles) ? careerAdvice.suitableRoles.map(String) : [],
      resumeTips: Array.isArray(careerAdvice?.resumeTips) ? careerAdvice.resumeTips.map(String) : [],
      githubOptimizationTips: Array.isArray(careerAdvice?.githubOptimizationTips) ? careerAdvice.githubOptimizationTips.map(String) : [],
      growthSuggestions: Array.isArray(careerAdvice?.growthSuggestions) ? careerAdvice.growthSuggestions.map(String) : [],
    },
  };
}

/** 将分数限制在 0-100 范围内 */
function clampScore(value: unknown, fallback = 50): number {
  const num = typeof value === "number" ? value : Number(value);
  if (isNaN(num)) return fallback;
  return Math.min(100, Math.max(0, Math.round(num)));
}

/** 调用 DeepSeek API 分析 GitHub 用户 */
export async function analyzeWithDeepSeek(
  user: GitHubUser,
  repos: GitHubRepo[],
  stats: GitHubStats
): Promise<DeepSeekAnalysis> {
  checkDeepSeekConfig();

  const prompt = buildPrompt(user, repos, stats);

  const res = await fetch(`${DEEPSEEK_BASE_URL}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content:
            "You are a professional GitHub profile analyst. You MUST return ONLY valid JSON without any markdown formatting, code blocks, or explanation.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 4096,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "未知错误");
    throw new Error(`DeepSeek API 请求失败（${res.status}）: ${errorText}`);
  }

  const data = await res.json();
  const content: string | undefined = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("DeepSeek API 返回了空结果");
  }

  const parsed = tryParseDeepSeekResponse(content);
  if (!parsed) {
    throw new Error("DeepSeek 返回了无法解析的格式");
  }

  return validateAnalysis(parsed as unknown as Record<string, unknown>);
}
