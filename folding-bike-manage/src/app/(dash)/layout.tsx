import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";

export default function DashLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link href="/" className="text-base font-semibold">
            🚲 折叠车 DIY · 管理后台
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link
              href="/parts"
              className="text-muted-foreground hover:text-foreground"
            >
              配件管理
            </Link>
            <Link
              href="/orders"
              className="text-muted-foreground hover:text-foreground"
            >
              配置单
            </Link>
            <LogoutButton />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-6">{children}</main>
    </div>
  );
}
