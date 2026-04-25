"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Loader2, Bot, User, AlertCircle } from "lucide-react";
import type {
  ChatMessage,
  GitHubUser,
  GitHubStats,
  DeepSeekAnalysis,
  DeepSeekConfig,
} from "@/lib/types";

interface Props {
  profile: GitHubUser;
  stats: GitHubStats;
  analysis: DeepSeekAnalysis;
  config: DeepSeekConfig | null;
}

export default function ChatPanel({ profile, stats, analysis, config }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || streaming) return;

    setInput("");
    setError(null);
    const userMsg: ChatMessage = { role: "user", content: text };
    const assistantMsg: ChatMessage = { role: "assistant", content: "" };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setStreaming(true);

    try {
      const apiKey = config?.apiKey || "";
      if (!apiKey) {
        setError("请先在 API 配置中填入 DeepSeek Key");
        setStreaming(false);
        return;
      }

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          profile,
          stats,
          analysis,
          config,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "请求失败" }));
        setError(err.error || "请求失败");
        setMessages((prev) => prev.slice(0, -1));
        setStreaming(false);
        return;
      }

      // 处理流式响应
      const reader = res.body?.getReader();
      if (!reader) {
        setError("无法读取响应流");
        setStreaming(false);
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              const delta =
                parsed.choices?.[0]?.delta?.content ||
                parsed.content ||
                "";
              if (delta) {
                setMessages((prev) => {
                  const next = [...prev];
                  const last = next[next.length - 1];
                  if (last?.role === "assistant") {
                    next[next.length - 1] = {
                      ...last,
                      content: last.content + delta,
                    };
                  }
                  return next;
                });
              }
            } catch {
              // 跳过解析失败的 chunk
            }
          }
        }
      }
    } catch {
      const errMsg = "网络请求失败";
      setError(errMsg);
      setMessages((prev) => prev.slice(0, -1));
    }
    setStreaming(false);
  };

  return (
    <div className="bg-gray-900/80 border border-gray-800 rounded-2xl mb-6 overflow-hidden">
      {/* 标题 */}
      <div className="flex items-center gap-2 px-6 pt-5 pb-3 border-b border-gray-800">
        <MessageSquare className="w-4 h-4 text-blue-400" />
        <h3 className="text-white font-semibold">AI 对话追问</h3>
        <span className="text-xs text-gray-500 ml-1">
          针对分析结果进一步提问
        </span>
      </div>

      {/* 消息列表 */}
      <div className="px-6 py-4 max-h-80 overflow-y-auto space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-6">
            <Bot className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">
              你可以问我关于 {profile.login} 的任何问题
            </p>
            <p className="text-gray-600 text-xs mt-1">
              例如：他适合什么岗位？技术栈有什么不足？项目质量如何？
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex items-start gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
          >
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="w-4 h-4 text-blue-400" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-blue-600/20 text-blue-200 border border-blue-500/20"
                  : "bg-gray-800/60 text-gray-200 border border-gray-700/50"
              }`}
            >
              {msg.content || (
                <span className="text-gray-500 italic">思考中...</span>
              )}
            </div>
            {msg.role === "user" && (
              <div className="w-7 h-7 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <User className="w-4 h-4 text-purple-400" />
              </div>
            )}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* 输入区 */}
      <div className="px-6 pb-5 pt-2">
        {error && (
          <div className="flex items-center gap-1.5 text-red-400 text-xs mb-2">
            <AlertCircle className="w-3.5 h-3.5" />
            {error}
          </div>
        )}
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="输入你的问题..."
            disabled={streaming}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || streaming}
            className="px-4 py-2.5 bg-blue-600/20 text-blue-300 border border-blue-500/30 rounded-lg hover:bg-blue-600/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            {streaming ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
