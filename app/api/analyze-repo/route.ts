import { NextRequest, NextResponse } from "next/server";
import type { RepoAnalyzeRequest, RepoDeepAnalysis } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    let body: RepoAnalyzeRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "无效的 JSON" }, { status: 400 });
    }

    const { repo, config } = body;
    if (!repo?.full_name) {
      return NextResponse.json({ error: "缺少仓库信息" }, { status: 400 });
    }

    const apiKey =
      config?.apiKey || process.env.DEEPSEEK_API_KEY || "";
    if (!apiKey) {
      return NextResponse.json({ error: "DeepSeek API Key 未配置" }, { status: 400 });
    }

    const baseUrl =
      config?.baseUrl || process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
    const model = config?.model || "deepseek-v4-flash";

    const prompt = `You are a senior code reviewer. Analyze the following GitHub repository and provide structured feedback in Chinese.

## Repository
- Name: ${repo.full_name}
- Description: ${repo.description || "N/A"}
- Language: ${repo.language || "N/A"}
- Topics: ${repo.topics.join(", ") || "N/A"}
- Stars: ${repo.stargazers_count}
- Forks: ${repo.forks_count}
- Open Issues: ${repo.open_issues_count}
- Created: ${repo.created_at}
- Last Updated: ${repo.updated_at}
- Last Push: ${repo.pushed_at}
- Size: ${repo.size} KB

Return ONLY valid JSON:
{
  "summary": "Brief summary of this project in Chinese",
  "architecture": "Analysis of project architecture and structure in Chinese",
  "codeQuality": "Assessment of code quality and engineering practices in Chinese",
  "maintainability": "Maintainability assessment in Chinese",
  "strengths": ["Array of strengths in Chinese"],
  "suggestions": ["Array of improvement suggestions in Chinese"],
  "techDecisions": ["Array of notable technical decisions/choices in Chinese"]
}

Be objective. Base analysis solely on the metadata provided.`;

    const res = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "You are a senior code reviewer. Return ONLY valid JSON without markdown.",
          },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 2048,
      }),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => "");
      return NextResponse.json(
        { error: `DeepSeek API 请求失败（${res.status}）: ${err}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: "DeepSeek 返回空结果" }, { status: 502 });
    }

    let analysis: RepoDeepAnalysis;
    try {
      analysis = JSON.parse(content);
    } catch {
      const m = content.match(/\{[\s\S]*\}/);
      analysis = m ? JSON.parse(m[0]) : null;
    }
    if (!analysis) {
      return NextResponse.json(
        { error: "无法解析 DeepSeek 响应" },
        { status: 502 }
      );
    }

    return NextResponse.json({ analysis });
  } catch (e) {
    console.error("analyze-repo error:", e);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
