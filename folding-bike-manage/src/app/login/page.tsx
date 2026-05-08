"use client";
import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>管理后台登录</CardTitle>
        </CardHeader>
        <CardContent>
          <React.Suspense fallback={<LoginFormFallback />}>
            <LoginForm />
          </React.Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const from = params.get("from") || "/";
  const [submitting, setSubmitting] = React.useState(false);
  const toast = useToast();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get("password") || "");
    if (!password) {
      toast.show("请输入密码", { tone: "error" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "登录失败");
      }
      router.replace(from);
      router.refresh();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "登录失败", {
        tone: "error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">管理员密码</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          autoFocus
        />
      </div>
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "登录中…" : "登录"}
      </Button>
    </form>
  );
}

function LoginFormFallback() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">管理员密码</Label>
        <Input id="password" type="password" disabled />
      </div>
      <Button type="button" className="w-full" disabled>
        登录
      </Button>
    </div>
  );
}
