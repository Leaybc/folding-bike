"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { formatYuan, formatWeight } from "@/lib/utils";
import { CategoryDialog } from "@/components/parts/category-dialog";
import { PartDialog } from "@/components/parts/part-dialog";
import type { CategoryRow, PartRow } from "@/components/parts/types";

export function PartsManager({
  initialCategories,
}: {
  initialCategories: CategoryRow[];
}) {
  const router = useRouter();
  const toast = useToast();

  const [editingCategory, setEditingCategory] = React.useState<
    CategoryRow | "new" | null
  >(null);
  const [partDialog, setPartDialog] = React.useState<
    | { mode: "new"; categoryId: string }
    | { mode: "edit"; part: PartRow }
    | null
  >(null);

  async function deleteCategory(c: CategoryRow) {
    if (
      !confirm(
        `删除分类「${c.name}」？该分类下 ${c.parts.length} 个配件也会被删除。`,
      )
    )
      return;
    const res = await fetch(`/api/categories/${c.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.show("删除失败", { tone: "error" });
      return;
    }
    toast.show("已删除", { tone: "success" });
    router.refresh();
  }

  async function deletePart(p: PartRow) {
    if (!confirm(`删除配件「${p.brand} ${p.name}」？`)) return;
    const res = await fetch(`/api/parts/${p.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.show("删除失败", { tone: "error" });
      return;
    }
    toast.show("已删除", { tone: "success" });
    router.refresh();
  }

  async function togglePartActive(p: PartRow) {
    const res = await fetch(`/api/parts/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !p.active }),
    });
    if (!res.ok) {
      toast.show("操作失败", { tone: "error" });
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">配件管理</h1>
        <Button onClick={() => setEditingCategory("new")}>
          <Plus className="h-4 w-4" />
          新建分类
        </Button>
      </div>

      {initialCategories.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            还没有任何分类，先创建一个吧。
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {initialCategories.map((cat) => (
          <Card key={cat.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div className="flex items-center gap-3">
                <CardTitle>{cat.name}</CardTitle>
                <span className="text-xs text-muted-foreground">
                  排序 {cat.sortOrder} · {cat.parts.length} 个配件
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingCategory(cat)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteCategory(cat)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setPartDialog({ mode: "new", categoryId: cat.id })
                  }
                >
                  <Plus className="h-4 w-4" />
                  添加配件
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {cat.parts.length === 0 ? (
                <div className="rounded-md border border-dashed py-6 text-center text-sm text-muted-foreground">
                  该分类下还没有配件
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs text-muted-foreground">
                      <tr>
                        <th className="py-2 font-normal">品牌 · 型号</th>
                        <th className="py-2 font-normal">进价</th>
                        <th className="py-2 font-normal">售价</th>
                        <th className="py-2 font-normal">毛利</th>
                        <th className="py-2 font-normal">重量</th>
                        <th className="py-2 font-normal">备注</th>
                        <th className="py-2 font-normal">状态</th>
                        <th className="py-2 font-normal text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cat.parts.map((p) => {
                        const hasVariants = p.variants.length > 0;
                        const costs = hasVariants
                          ? p.variants.map((v) => v.costPrice)
                          : [p.costPrice];
                        const sells = hasVariants
                          ? p.variants.map((v) => v.sellPrice)
                          : [p.sellPrice];
                        const weights = hasVariants
                          ? p.variants.map((v) => v.weight)
                          : [p.weight];
                        const fmtRange = (
                          arr: number[],
                          fmt: (n: number) => string,
                        ) => {
                          const min = Math.min(...arr);
                          const max = Math.max(...arr);
                          return min === max
                            ? fmt(min)
                            : `${fmt(min)} ~ ${fmt(max)}`;
                        };
                        return (
                        <tr key={p.id} className="border-t">
                          <td className="py-2 pr-3">
                            <div className="flex items-center gap-2">
                              <div className="font-medium">{p.brand}</div>
                              {hasVariants && (
                                <span
                                  className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
                                  title={p.options
                                    .map((o) => o.name)
                                    .join(" / ")}
                                >
                                  {p.variants.length} 个规格
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {p.name}
                            </div>
                          </td>
                          <td className="py-2 pr-3">
                            {fmtRange(costs, formatYuan)}
                          </td>
                          <td className="py-2 pr-3">
                            {fmtRange(sells, formatYuan)}
                          </td>
                          <td className="py-2 pr-3 text-emerald-600">
                            {fmtRange(
                              sells.map((s, i) => s - costs[i]),
                              formatYuan,
                            )}
                          </td>
                          <td className="py-2 pr-3">
                            {fmtRange(weights, formatWeight)}
                          </td>
                          <td className="py-2 pr-3 max-w-[14rem] truncate text-muted-foreground">
                            {p.note || "—"}
                          </td>
                          <td className="py-2 pr-3">
                            <button
                              onClick={() => togglePartActive(p)}
                              className={
                                p.active
                                  ? "rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700"
                                  : "rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                              }
                            >
                              {p.active ? "在售" : "下架"}
                            </button>
                          </td>
                          <td className="py-2 pr-0 text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                setPartDialog({ mode: "edit", part: p })
                              }
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deletePart(p)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <CategoryDialog
        state={editingCategory}
        onClose={() => setEditingCategory(null)}
        onDone={() => {
          setEditingCategory(null);
          router.refresh();
        }}
      />
      <PartDialog
        state={partDialog}
        categories={initialCategories.map((c) => ({ id: c.id, name: c.name }))}
        onClose={() => setPartDialog(null)}
        onDone={() => {
          setPartDialog(null);
          router.refresh();
        }}
      />
    </div>
  );
}
