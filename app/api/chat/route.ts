import { NextRequest } from "next/server";
import type { ChatRequest } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    let body: ChatRequest;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "无效的 JSON" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { messages, profile, stats, analysis, config } = body;

    const apiKey =
      config?.apiKey || process.env.DEEPSEEK_API_KEY || "";
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API Key 未配置" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const baseUrl =
      config?.baseUrl || process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
    const model = config?.model || "deepseek-v4-flash";

    // 构建系统提示，让 AI 了解上下文
    const systemPrompt = `You are a helpful assistant that answers questions about a GitHub developer profile analysis. Here is the context:

## User Profile
- Username: ${profile.login}
- Name: ${profile.name || profile.login}
- Bio: ${profile.bio || "N/A"}
- Followers: ${profile.followers}
- Public Repos: ${profile.public_repos}

## Stats
- Total Stars: ${stats.totalStars}
- Total Forks: ${stats.totalForks}
- Top Languages: ${stats.topLanguages.map((l) => l.language).join(", ")}
- Average Stars/Repo: ${stats.averageStars}

## AI Analysis Summary
${analysis?.summary || "N/A"}
- Developer Type: ${analysis?.developerType?.join(", ") || "N/A"}
- Overall Score: ${analysis?.scores?.overall ?? "N/A"}

Answer questions in Chinese. Be helpful, specific, and reference the data above when relevant.`;

    // 构造请求体
    const requestBody: Record<string, unknown> = {
      model,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      stream: true,
      max_tokens: 2048,
    };

    if (config?.thinkingEnabled) {
      requestBody.thinking = {
        type: "enabled",
        reasoning_effort: config.reasoningEffort || "high",
      };
    }

    const deepseekRes = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!deepseekRes.ok) {
      const errText = await deepseekRes.text().catch(() => "");
      return new Response(
        JSON.stringify({ error: `DeepSeek API 错误（${deepseekRes.status}）` }),
        {
          status: 502,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 流式转发 DeepSeek 的 SSE 响应
    const contentType = deepseekRes.headers.get("content-type") || "";
    if (contentType.includes("text/event-stream") || deepseekRes.body) {
      return new Response(deepseekRes.body, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    const json = await deepseekRes.json();
    const content = json.choices?.[0]?.message?.content || "";
    return new Response(
      `data: ${JSON.stringify({ content })}\n\ndata: [DONE]\n\n`,
      {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
        },
      }
    );
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: "服务器内部错误" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
