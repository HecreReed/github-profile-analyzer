import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GitHub 个人分析 - AI 开发者画像",
  description:
    "输入 GitHub 主页，AI 自动分析开发者画像、技术栈、项目质量与职业竞争力",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="bg-gray-950 text-gray-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
