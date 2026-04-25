# GitHub 个人分析

输入 GitHub 用户名或主页链接，AI 自动分析开发者画像、技术栈、项目质量与职业竞争力。

## 功能

- **GitHub 数据采集** — 拉取用户基础信息、仓库列表、star/fork 等统计数据
- **多维统计分析** — 语言分布、最受欢迎仓库、活跃度分析等本地统计
- **AI 智能分析** — 基于 DeepSeek API 进行多维度评估，包括技术深度、项目完整度、开源影响力、职业吸引力等
- **职业发展建议** — 根据 GitHub 数据提供岗位建议、简历优化、技术成长方向等具体建议
- **综合评分系统** — 6 个子维度评分 + 综合评分，可视化展示

## 技术栈

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **图标**: Lucide React
- **AI**: DeepSeek API

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制环境变量模板：

```bash
cp .env.example .env.local
```

编辑 `.env.local`，填入配置：

```env
# DeepSeek API 配置（必填，AI 分析功能需要）
DEEPSEEK_API_KEY=your_deepseek_api_key_here

# DeepSeek API 地址（可选，默认为 https://api.deepseek.com）
DEEPSEEK_BASE_URL=https://api.deepseek.com

# GitHub Token（可选，用于提升 API 频率限制，从 60 次/小时 提升到 5000 次/小时）
# 获取方式：https://github.com/settings/tokens
GITHUB_TOKEN=your_github_token_optional
```

> **注意**：即使不配置 DeepSeek API，应用也能展示 GitHub 基础数据统计。AI 分析功能需要 DEEPSEEK_API_KEY。

### 3. 启动开发服务

```bash
npm run dev
```

打开浏览器访问 [http://localhost:3000](http://localhost:3000)

### 4. 使用

1. 在输入框中输入 GitHub 用户名（如 `octocat`）或完整主页链接（如 `https://github.com/octocat`）
2. 点击「分析」按钮
3. 等待数据采集和 AI 分析完成
4. 查看多维度的开发者画像分析报告

## 项目结构

```
├── app/
│   ├── api/
│   │   └── analyze/
│   │       └── route.ts      # POST /api/analyze 后端接口
│   ├── globals.css            # 全局样式
│   ├── layout.tsx             # 根布局
│   └── page.tsx               # 主页面
├── components/
│   ├── AnalysisForm.tsx       # 输入表单组件
│   ├── AnalysisResult.tsx     # AI 分析结果展示
│   ├── ErrorState.tsx         # 错误状态组件
│   ├── LoadingState.tsx       # 加载状态组件
│   ├── ProfileSummary.tsx     # 用户信息卡片
│   ├── RepoList.tsx           # 仓库列表
│   └── ScoreGauge.tsx         # 评分仪表盘
├── lib/
│   ├── deepseek.ts            # DeepSeek API 封装
│   ├── github.ts              # GitHub API 封装 + 统计计算
│   └── types.ts               # TypeScript 类型定义
├── .env.example               # 环境变量模板
├── next.config.mjs            # Next.js 配置
├── package.json
├── postcss.config.js
├── tailwind.config.ts
└── tsconfig.json
```

## API 接口

### POST /api/analyze

请求：
```json
{
  "input": "https://github.com/octocat"
}
```

成功响应：
```json
{
  "profile": { ... },
  "repositories": [ ... ],
  "stats": { ... },
  "analysis": { ... }
}
```

失败响应：
```json
{
  "error": "错误信息描述"
}
```

## 常见问题

### GitHub API 频率限制

未认证的请求限制为 60 次/小时。建议在 `.env.local` 中配置 `GITHUB_TOKEN`，限制提升至 5000 次/小时。

### DeepSeek API 超时

如果分析结果返回较慢，可能是 DeepSeek API 响应时间波动。可调整 `lib/deepseek.ts` 中的 `max_tokens` 参数。

### AI 分析不准确

AI 分析基于 GitHub 公开数据，对于信息较少的用户，分析结果可能不够精确。这是正常现象。

## 注意事项

- **不要将 API Key 提交到 Git 仓库**，`.env.local` 已包含在 `.gitignore` 中
- GitHub 无公开数据的用户无法分析
- AI 分析仅供参考，不构成任何决策依据

## License

MIT
