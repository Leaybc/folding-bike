import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "折叠车 DIY · 管理后台",
  description: "管理配件与配置单",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-dvh bg-secondary/40">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
