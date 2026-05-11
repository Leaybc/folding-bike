"use client";
import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import type { CategoryWithPartsDTO, Selection, SelectionMap } from "@/lib/types";
import { formatYuan, formatWeight } from "@/lib/utils";

type Totals = { count: number; price: number; weight: number };

type ItemRow = {
  categoryId: string;
  categoryName: string;
  sel: Selection;
};

function priceOf(sel: Selection): number {
  if (sel.kind !== "part") return 0;
  return sel.variant?.sellPrice ?? sel.part.sellPrice;
}

export function OrderForm({
  selection,
  categories,
  totals,
  onSuccess,
}: {
  selection: SelectionMap;
  categories: CategoryWithPartsDTO[];
  totals: Totals;
  onSuccess: () => void;
}) {
  const [submitting, setSubmitting] = React.useState(false);
  const toast = useToast();

  const items: ItemRow[] = React.useMemo(
    () =>
      categories
        .map((c) => {
          const sel = selection[c.id];
          return sel ? { categoryId: c.id, categoryName: c.name, sel } : null;
        })
        .filter((x): x is ItemRow => x !== null),
    [selection, categories],
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    const form = new FormData(e.currentTarget);
    const payload = {
      customerName: String(form.get("customerName") ?? "").trim(),
      phone: String(form.get("phone") ?? "").trim(),
      wechat: String(form.get("wechat") ?? "").trim() || null,
      note: String(form.get("note") ?? "").trim() || null,
      items: items.map((i) =>
        i.sel.kind === "part"
          ? {
              kind: "part" as const,
              partId: i.sel.part.id,
              ...(i.sel.variant ? { variantId: i.sel.variant.id } : {}),
            }
          : { kind: "other" as const, categoryId: i.categoryId },
      ),
    };

    if (!payload.customerName) {
      toast.show("请填写姓名", { tone: "error" });
      return;
    }
    if (!/^1\d{10}$/.test(payload.phone)) {
      toast.show("请输入正确的 11 位手机号", { tone: "error" });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error || "提交失败");
      }
      onSuccess();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "提交失败";
      toast.show(msg, { tone: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-md border bg-secondary/50 p-3">
        <div className="text-xs text-muted-foreground">配置预览</div>
        <ul className="mt-2 space-y-1.5 text-sm">
          {items.map((i) => (
            <li key={i.categoryId} className="flex justify-between gap-3">
              <span className="min-w-0 flex-1">
                <span className="text-muted-foreground">{i.categoryName}：</span>
                {i.sel.kind === "part" ? (
                  <>
                    {i.sel.part.brand} {i.sel.part.name}
                    {i.sel.variantLabel && (
                      <span className="ml-1 text-xs text-muted-foreground">
                        （{i.sel.variantLabel}）
                      </span>
                    )}
                  </>
                ) : (
                  "其他"
                )}
              </span>
              <span className="shrink-0 font-medium">
                {i.sel.kind === "part" ? formatYuan(priceOf(i.sel)) : "¥0"}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex items-center justify-between border-t pt-2 text-sm">
          <span className="text-muted-foreground">
            合计 {totals.count} 件 · {formatWeight(totals.weight)}
          </span>
          <span className="text-base font-bold text-primary">
            {formatYuan(totals.price)}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="customerName">姓名 *</Label>
        <Input id="customerName" name="customerName" autoComplete="name" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">手机号 *</Label>
        <Input
          id="phone"
          name="phone"
          inputMode="numeric"
          autoComplete="tel"
          maxLength={11}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="wechat">微信号</Label>
        <Input id="wechat" name="wechat" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="note">备注</Label>
        <Textarea id="note" name="note" rows={3} placeholder="任何额外的需求或说明" />
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={submitting}
        aria-busy={submitting}
      >
        {submitting && <Loader2 className="h-5 w-5 animate-spin" />}
        {submitting ? "提交中…" : "确认提交"}
      </Button>
    </form>
  );
}
