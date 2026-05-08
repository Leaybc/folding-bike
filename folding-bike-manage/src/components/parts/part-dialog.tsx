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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import type { PartRow } from "@/components/parts/types";

type State =
  | { mode: "new"; categoryId: string }
  | { mode: "edit"; part: PartRow }
  | null;

export function PartDialog({
  state,
  categories,
  onClose,
  onDone,
}: {
  state: State;
  categories: { id: string; name: string }[];
  onClose: () => void;
  onDone: () => void;
}) {
  const open = state !== null;
  const isNew = state?.mode === "new";
  const editing = state?.mode === "edit" ? state.part : null;
  const [submitting, setSubmitting] = React.useState(false);
  const toast = useToast();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    const fd = new FormData(e.currentTarget);
    const payload = {
      categoryId: String(fd.get("categoryId") || ""),
      brand: String(fd.get("brand") || "").trim(),
      name: String(fd.get("name") || "").trim(),
      costPrice: Number(fd.get("costPrice") || 0),
      sellPrice: Number(fd.get("sellPrice") || 0),
      weight: Number(fd.get("weight") || 0),
      note: String(fd.get("note") || "").trim() || null,
      active: fd.get("active") === "on",
    };

    if (!payload.categoryId) {
      toast.show("请选择分类", { tone: "error" });
      return;
    }
    if (!payload.brand || !payload.name) {
      toast.show("请填写品牌与型号", { tone: "error" });
      return;
    }
    if (!Number.isFinite(payload.costPrice) || payload.costPrice < 0) {
      toast.show("进价无效", { tone: "error" });
      return;
    }
    if (!Number.isFinite(payload.sellPrice) || payload.sellPrice < 0) {
      toast.show("售价无效", { tone: "error" });
      return;
    }

    setSubmitting(true);
    try {
      const url = isNew ? "/api/parts" : `/api/parts/${editing!.id}`;
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

  const defaultCategoryId =
    state?.mode === "new" ? state.categoryId : editing?.categoryId ?? "";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isNew ? "添加配件" : "编辑配件"}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="categoryId">所属分类 *</Label>
            <select
              id="categoryId"
              name="categoryId"
              defaultValue={defaultCategoryId}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
              required
            >
              <option value="">— 请选择 —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="brand">品牌 *</Label>
            <Input
              id="brand"
              name="brand"
              defaultValue={editing?.brand ?? ""}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">型号 / 名称 *</Label>
            <Input
              id="name"
              name="name"
              defaultValue={editing?.name ?? ""}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="costPrice">进价（元） *</Label>
            <Input
              id="costPrice"
              name="costPrice"
              type="number"
              min={0}
              step={1}
              defaultValue={editing?.costPrice ?? 0}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sellPrice">售价（元） *</Label>
            <Input
              id="sellPrice"
              name="sellPrice"
              type="number"
              min={0}
              step={1}
              defaultValue={editing?.sellPrice ?? 0}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="weight">重量（克）</Label>
            <Input
              id="weight"
              name="weight"
              type="number"
              min={0}
              step={1}
              defaultValue={editing?.weight ?? 0}
            />
          </div>
          <div className="flex items-center gap-2 sm:col-span-1">
            <input
              id="active"
              name="active"
              type="checkbox"
              defaultChecked={editing?.active ?? true}
              className="h-4 w-4"
            />
            <Label htmlFor="active">在售（用户可见）</Label>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="note">备注</Label>
            <Textarea
              id="note"
              name="note"
              defaultValue={editing?.note ?? ""}
              rows={2}
            />
          </div>
          <DialogFooter className="sm:col-span-2">
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
