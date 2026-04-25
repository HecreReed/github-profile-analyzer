/* ===== GitHub 数据类型 ===== */

export interface GitHubUser {
  login: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  location: string | null;
  blog: string | null;
  company: string | null;
  followers: number;
  following: number;
  public_repos: number;
  created_at: string;
  updated_at: string;
  html_url: string;
}

export interface GitHubRepo {
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  topics: string[];
  created_at: string;
  updated_at: string;
  pushed_at: string;
  size: number;
  open_issues_count: number;
}

/* ===== 本地统计数据 ===== */

export interface GitHubStats {
  totalStars: number;
  totalForks: number;
  totalRepos: number;
  totalFollowers: number;
  topLanguages: { language: string; count: number; percentage: number }[];
  topRepos: GitHubRepo[];
  mostRecentRepos: GitHubRepo[];
  averageStars: number;
  hasLongTermProjects: boolean;
  hasRecentActivity: boolean;
  techKeywords: string[];
}

/* ===== DeepSeek 配置（用户在前端填写） ===== */

export interface DeepSeekConfig {
  apiKey: string;
  model: string;
  baseUrl: string;
  thinkingEnabled: boolean;
  reasoningEffort: "high" | "max";
}

/* ===== DeepSeek AI 分析类型 ===== */

export interface AnalysisScores {
  overall: number;
  technicalDepth: number;
  projectCompleteness: number;
  openSourceInfluence: number;
  activity: number;
  technicalBreadth: number;
  careerAttractiveness: number;
}

export interface TechStack {
  primaryLanguages: string[];
  frameworks: string[];
  domains: string[];
}

export interface CareerAdvice {
  suitableRoles: string[];
  resumeTips: string[];
  githubOptimizationTips: string[];
  growthSuggestions: string[];
}

export interface RepresentativeProject {
  name: string;
  reason: string;
}

export interface DeepSeekAnalysis {
  summary: string;
  developerType: string[];
  scores: AnalysisScores;
  techStack: TechStack;
  strengths: string[];
  weaknesses: string[];
  representativeProjects: RepresentativeProject[];
  activityAnalysis: string;
  careerAdvice: CareerAdvice;
}

/* ===== API 请求/响应类型 ===== */

export interface AnalyzeRequest {
  input: string;
  config?: DeepSeekConfig;
}

export interface AnalyzeResponse {
  profile: GitHubUser;
  repositories: GitHubRepo[];
  stats: GitHubStats;
  analysis: DeepSeekAnalysis | null;
  warning?: string;
}

export interface AnalyzeErrorResponse {
  error: string;
}
