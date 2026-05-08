"use client";
import * as React from "react";
import { ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import type { CategoryWithPartsDTO, PartDTO, SelectionMap } from "@/lib/types";
import { formatYuan, formatWeight } from "@/lib/utils";
import { OrderForm } from "@/components/order-form";

export function Configurator({
  categories,
}: {
  categories: CategoryWithPartsDTO[];
}) {
  const [selection, setSelection] = React.useState<SelectionMap>({});
  const [openCategory, setOpenCategory] =
    React.useState<CategoryWithPartsDTO | null>(null);
  const [orderOpen, setOrderOpen] = React.useState(false);
  const toast = useToast();

  const totals = React.useMemo(() => {
    let count = 0;
    let price = 0;
    let weight = 0;
    for (const part of Object.values(selection)) {
      if (!part) continue;
      count += 1;
      price += part.sellPrice;
      weight += part.weight;
    }
    return { count, price, weight };
  }, [selection]);

  const handlePick = (categoryId: string, part: PartDTO | undefined) => {
    setSelection((prev) => ({ ...prev, [categoryId]: part }));
    setOpenCategory(null);
  };

  const handleSubmit = () => {
    if (totals.count === 0) {
      toast.show("请先选择至少一个配件", { tone: "error" });
      return;
    }
    setOrderOpen(true);
  };

  const handleReset = () => {
    setSelection({});
    toast.show("已清空选择");
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col bg-secondary/40">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background px-4 py-3">
        <h1 className="text-lg font-semibold">🚲 折叠车 DIY</h1>
        <Button variant="ghost" size="sm" onClick={handleReset}>
          清空
        </Button>
      </header>

      <main className="flex-1 px-4 pb-32 pt-4">
        {categories.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="space-y-2">
            {categories.map((cat) => (
              <CategoryRow
                key={cat.id}
                category={cat}
                selected={selection[cat.id]}
                onClick={() => setOpenCategory(cat)}
              />
            ))}
          </ul>
        )}
      </main>

      <footer className="fixed inset-x-0 bottom-0 z-10 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-3 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="leading-tight">
            <div className="text-xs text-muted-foreground">
              已选 <span className="font-semibold text-foreground">{totals.count}</span> 件
              {totals.weight > 0 && (
                <span className="ml-2">
                  约 <span className="font-semibold text-foreground">{formatWeight(totals.weight)}</span>
                </span>
              )}
            </div>
            <div className="text-2xl font-bold text-primary">
              {formatYuan(totals.price)}
            </div>
          </div>
          <Button size="lg" onClick={handleSubmit}>
            生成配置单
          </Button>
        </div>
      </footer>

      <Dialog
        open={!!openCategory}
        onOpenChange={(o) => !o && setOpenCategory(null)}
      >
        {openCategory && (
          <DialogContent className="max-h-[80dvh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>选择 {openCategory.name}</DialogTitle>
            </DialogHeader>
            <PartList
              parts={openCategory.parts}
              currentId={selection[openCategory.id]?.id}
              onPick={(p) => handlePick(openCategory.id, p)}
              onClear={() => handlePick(openCategory.id, undefined)}
            />
          </DialogContent>
        )}
      </Dialog>

      <Dialog open={orderOpen} onOpenChange={setOrderOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>提交配置单</DialogTitle>
          </DialogHeader>
          <OrderForm
            selection={selection}
            categories={categories}
            totals={totals}
            onSuccess={() => {
              setOrderOpen(false);
              setSelection({});
              toast.show("配置单已提交，我们会尽快联系你！", {
                tone: "success",
              });
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CategoryRow({
  category,
  selected,
  onClick,
}: {
  category: CategoryWithPartsDTO;
  selected: PartDTO | undefined;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center justify-between rounded-lg border bg-background p-4 text-left active:bg-accent"
      >
        <div className="min-w-0">
          <div className="text-sm text-muted-foreground">{category.name}</div>
          {selected ? (
            <div className="mt-0.5 truncate font-medium">
              {selected.brand} · {selected.name}
            </div>
          ) : (
            <div className="mt-0.5 text-muted-foreground">
              {category.parts.length > 0
                ? `${category.parts.length} 个可选`
                : "暂无配件"}
            </div>
          )}
        </div>
        <div className="ml-3 flex items-center gap-2">
          {selected && (
            <span className="text-sm font-semibold text-primary">
              {formatYuan(selected.sellPrice)}
            </span>
          )}
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </button>
    </li>
  );
}

function PartList({
  parts,
  currentId,
  onPick,
  onClear,
}: {
  parts: PartDTO[];
  currentId: string | undefined;
  onPick: (p: PartDTO) => void;
  onClear: () => void;
}) {
  if (parts.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        该分类下还没有配件
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {currentId && (
        <Button variant="outline" size="sm" onClick={onClear} className="w-full">
          取消选择
        </Button>
      )}
      {parts.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => onPick(p)}
          className={`flex w-full items-start justify-between gap-3 rounded-md border p-3 text-left active:bg-accent ${
            p.id === currentId ? "border-primary bg-primary/5" : ""
          }`}
        >
          <div className="min-w-0 flex-1">
            <div className="font-medium">
              {p.brand} <span className="text-muted-foreground">·</span>{" "}
              {p.name}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {formatWeight(p.weight)}
              {p.note ? ` · ${p.note}` : ""}
            </div>
          </div>
          <div className="font-semibold text-primary">
            {formatYuan(p.sellPrice)}
          </div>
        </button>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-20 text-center">
      <div className="text-4xl">🛠️</div>
      <h2 className="mt-3 font-semibold">配件还在筹备中</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        管理员还没有添加任何配件分类。请稍后再来看看～
      </p>
    </div>
  );
}
