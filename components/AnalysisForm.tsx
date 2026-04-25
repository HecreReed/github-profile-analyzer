"use client";

import { useState } from "react";
import { Search, Sparkles } from "lucide-react";

interface AnalysisFormProps {
  onAnalyze: (input: string) => void;
  loading: boolean;
}

const EXAMPLES = [
  { label: "octocat", value: "octocat" },
  { label: "torvalds", value: "torvalds" },
  { label: "vercel", value: "vercel" },
  { label: "antfu", value: "antfu" },
];

export default function AnalysisForm({ onAnalyze, loading }: AnalysisFormProps) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (trimmed && !loading) {
      onAnalyze(trimmed);
    }
  };

  const handleExample = (value: string) => {
    setInput(value);
    onAnalyze(value);
  };

  return (
    <div className="mb-10">
      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5 pointer-events-none" />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入 GitHub 用户名或主页链接..."
            disabled={loading}
            className="w-full pl-12 pr-4 py-3.5 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 text-base"
          />
        </div>
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 text-base"
        >
          <Sparkles className="w-4 h-4" />
          {loading ? "分析中..." : "分析"}
        </button>
      </form>

      <div className="flex items-center gap-2 mt-3">
        <span className="text-xs text-gray-500">试试：</span>
        {EXAMPLES.map((example) => (
          <button
            key={example.value}
            type="button"
            onClick={() => handleExample(example.value)}
            disabled={loading}
            className="px-3 py-1.5 text-sm bg-gray-800/80 text-gray-400 rounded-lg hover:bg-gray-700 hover:text-gray-200 transition-all disabled:opacity-50 font-mono"
          >
            {example.label}
          </button>
        ))}
      </div>
    </div>
  );
}
