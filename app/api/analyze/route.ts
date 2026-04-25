import { NextRequest, NextResponse } from "next/server";
import {
  parseUsername,
  fetchGitHubUser,
  fetchGitHubRepos,
  fetchUserOrgs,
  fetchContributions,
  computeStats,
} from "@/lib/github";
import { analyzeWithDeepSeek } from "@/lib/deepseek";
import type { DeepSeekConfig } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    let body: { input?: string; config?: DeepSeekConfig };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "请求体必须是有效的 JSON" }, { status: 400 });
    }

    const { input, config } = body;
    if (!input || typeof input !== "string") {
      return NextResponse.json({ error: "请输入 GitHub 用户名或主页链接" }, { status: 400 });
    }

    // 1. 解析用户名
    let username: string;
    try {
      username = parseUsername(input);
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "无法解析输入" },
        { status: 400 }
      );
    }

    // 2. GitHub 数据
    let user, repos, orgs, contributionData;
    try {
      [user, repos, orgs, contributionData] = await Promise.all([
        fetchGitHubUser(username),
        fetchGitHubRepos(username).catch(() => []),
        fetchUserOrgs(username),
        fetchContributions(username),
      ]);
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "GitHub API 请求失败" },
        { status: 502 }
      );
    }

    // 3. 本地统计
    const stats = computeStats(user, repos, orgs);

    // 4. DeepSeek
    const apiKey = config?.apiKey || process.env.DEEPSEEK_API_KEY || "";
    if (!apiKey) {
      return NextResponse.json({
        profile: user,
        repositories: repos,
        stats,
        contributionData,
        analysis: null,
        warning: "DeepSeek API Key 未配置。请在页面中点击「API 配置」填入 Key",
      });
    }

    let analysis;
    try {
      analysis = await analyzeWithDeepSeek(user, repos, stats, {
        apiKey,
        model: config?.model || "deepseek-v4-flash",
        baseUrl: config?.baseUrl || process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com",
        thinkingEnabled: config?.thinkingEnabled ?? false,
        reasoningEffort: config?.reasoningEffort || "high",
      });
    } catch (e) {
      return NextResponse.json({
        profile: user,
        repositories: repos,
        stats,
        contributionData,
        analysis: null,
        warning: `AI 分析暂不可用: ${e instanceof Error ? e.message : "请求失败"}`,
      });
    }

    return NextResponse.json({
      profile: user,
      repositories: repos,
      stats,
      contributionData,
      analysis,
    });
  } catch (e) {
    console.error("API Error:", e);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}
