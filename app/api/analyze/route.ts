import { NextRequest, NextResponse } from "next/server";
import { parseUsername, fetchGitHubUser, fetchGitHubRepos, computeStats } from "@/lib/github";
import { analyzeWithDeepSeek, checkDeepSeekConfig } from "@/lib/deepseek";

export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    let body: { input?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "请求体必须是有效的 JSON" }, { status: 400 });
    }

    const { input } = body;

    if (!input || typeof input !== "string") {
      return NextResponse.json(
        { error: "请输入 GitHub 用户名或主页链接" },
        { status: 400 }
      );
    }

    // 1. 解析用户名
    let username: string;
    try {
      username = parseUsername(input);
    } catch (e) {
      const message = e instanceof Error ? e.message : "无法解析输入";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    // 2. 获取 GitHub 数据
    let user;
    let repos;
    try {
      user = await fetchGitHubUser(username);
      repos = await fetchGitHubRepos(username);
    } catch (e) {
      const message = e instanceof Error ? e.message : "GitHub API 请求失败";
      return NextResponse.json({ error: message }, { status: 502 });
    }

    // 3. 计算本地统计
    const stats = computeStats(user, repos);

    // 4. 检查 DeepSeek 配置
    let deepSeekAvailable = true;
    try {
      checkDeepSeekConfig();
    } catch {
      deepSeekAvailable = false;
    }

    if (!deepSeekAvailable) {
      return NextResponse.json({
        profile: user,
        repositories: repos,
        stats,
        analysis: null,
        warning:
          "DeepSeek API 未配置，AI 分析功能不可用。请在 .env.local 中设置 DEEPSEEK_API_KEY",
      });
    }

    // 5. DeepSeek AI 分析
    let analysis;
    try {
      analysis = await analyzeWithDeepSeek(user, repos, stats);
    } catch (e) {
      const message = e instanceof Error ? e.message : "DeepSeek API 请求失败";
      return NextResponse.json({
        profile: user,
        repositories: repos,
        stats,
        analysis: null,
        warning: `AI 分析暂不可用: ${message}`,
      });
    }

    // 6. 返回完整结果
    return NextResponse.json({
      profile: user,
      repositories: repos,
      stats,
      analysis,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "服务器内部错误";
    console.error("API Error:", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
