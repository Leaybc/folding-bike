"use client";
import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import type { CategoryRow } from "@/components/parts/types";

type State = CategoryRow | "new" | null;

export function CategoryDialog({
  state,
  onClose,
  onDone,
}: {
  state: State;
  onClose: () => void;
  onDone: () => void;
}) {
  const open = state !== null;
  const isNew = state === "new";
  const cat = state && state !== "new" ? state : null;
  const [submitting, setSubmitting] = React.useState(false);
  const toast = useToast();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name") || "").trim(),
      sortOrder: Number(fd.get("sortOrder") || 0),
    };
    if (!payload.name) {
      toast.show("请输入分类名", { tone: "error" });
      return;
    }
    setSubmitting(true);
    try {
      const url = isNew ? "/api/categories" : `/api/categories/${cat!.id}`;
      const res = await fetch(url, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "保存失败");
      }
      toast.show("已保存", { tone: "success" });
      onDone();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "保存失败", {
        tone: "error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isNew ? "新建分类" : "编辑分类"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">分类名 *</Label>
            <Input
              id="name"
              name="name"
              defaultValue={cat?.name ?? ""}
              required
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sortOrder">排序（数字越小越靠前）</Label>
            <Input
              id="sortOrder"
              name="sortOrder"
              type="number"
              defaultValue={cat?.sortOrder ?? 100}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
            >
              取消
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "保存中…" : "保存"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
