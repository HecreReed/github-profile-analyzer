"use client";

import { useState, useEffect } from "react";
import { Settings, Eye, EyeOff, Check } from "lucide-react";
import type { DeepSeekConfig } from "@/lib/types";

const STORAGE_KEY = "github-analyzer-deepseek-config";

const MODELS = [
  { value: "deepseek-v4-flash", label: "DeepSeek V4 Flash (快速)" },
  { value: "deepseek-v4-pro", label: "DeepSeek V4 Pro (强力)" },
];

const REASONING_OPTIONS = [
  { value: "high", label: "高" },
  { value: "max", label: "最高" },
];

const DEFAULT_CONFIG: DeepSeekConfig = {
  apiKey: "",
  model: "deepseek-v4-flash",
  baseUrl: "https://api.deepseek.com",
  thinkingEnabled: false,
  reasoningEffort: "high",
};

function loadSavedConfig(): DeepSeekConfig {
  if (typeof window === "undefined") return { ...DEFAULT_CONFIG };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    // ignore
  }
  return { ...DEFAULT_CONFIG };
}

function saveConfig(c: DeepSeekConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
  } catch {
    // ignore
  }
}

interface DeepSeekPanelProps {
  onConfigChange: (config: DeepSeekConfig) => void;
}

export default function DeepSeekPanel({ onConfigChange }: DeepSeekPanelProps) {
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState<DeepSeekConfig>(DEFAULT_CONFIG);
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  // 初始化
  useEffect(() => {
    const savedConfig = loadSavedConfig();
    setConfig(savedConfig);
    onConfigChange(savedConfig);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (partial: Partial<DeepSeekConfig>) => {
    const next = { ...config, ...partial };
    setConfig(next);
    saveConfig(next);
    onConfigChange(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="mb-6">
      {/* 折叠按钮 */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors group"
      >
        <Settings
          className={`w-4 h-4 transition-transform ${open ? "rotate-90" : ""}`}
        />
        <span>API 配置</span>
        {config.apiKey ? (
          <span className="w-2 h-2 rounded-full bg-green-500" title="已配置" />
        ) : (
          <span className="text-xs text-yellow-500">未配置</span>
        )}
      </button>

      {/* 配置面板 */}
      {open && (
        <div className="mt-3 bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
          {/* 标题 */}
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold text-sm">DeepSeek API 配置</h3>
            {saved && (
              <span className="text-xs text-green-400 flex items-center gap-1">
                <Check className="w-3 h-3" /> 已保存
              </span>
            )}
          </div>

          {/* API Key */}
          <div>
            <label className="text-gray-400 text-xs block mb-1.5">
              API Key <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={config.apiKey}
                onChange={(e) => update({ apiKey: e.target.value })}
                placeholder="sk-xxxxxxxxxxxxxxxx"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 pr-10 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                tabIndex={-1}
              >
                {showKey ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-gray-600 text-xs mt-1">
              Key 仅存储在本地浏览器，不会上传到任何第三方
            </p>
          </div>

          {/* 模型选择 */}
          <div>
            <label className="text-gray-400 text-xs block mb-1.5">模型</label>
            <select
              value={config.model}
              onChange={(e) => update({ model: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {MODELS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* API 地址 */}
          <div>
            <label className="text-gray-400 text-xs block mb-1.5">
              API 地址
            </label>
            <input
              type="text"
              value={config.baseUrl}
              onChange={(e) => update({ baseUrl: e.target.value })}
              placeholder="https://api.deepseek.com"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Thinking 开关 */}
          <div className="flex items-center justify-between py-1">
            <div>
              <label className="text-gray-300 text-sm">
                思维链 (Thinking)
              </label>
              <p className="text-gray-600 text-xs mt-0.5">
                启用后模型会展示推理过程，结果更深入但速度较慢
              </p>
            </div>
            <button
              type="button"
              onClick={() => update({ thinkingEnabled: !config.thinkingEnabled })}
              className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                config.thinkingEnabled ? "bg-blue-600" : "bg-gray-700"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow-sm ${
                  config.thinkingEnabled ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>

          {/* 推理深度（Thinking 启用时） */}
          {config.thinkingEnabled && (
            <div>
              <label className="text-gray-400 text-xs block mb-1.5">
                推理深度
              </label>
              <select
                value={config.reasoningEffort}
                onChange={(e) =>
                  update({
                    reasoningEffort: e.target.value as "high" | "max",
                  })
                }
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {REASONING_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
