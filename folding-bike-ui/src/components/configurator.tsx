"use client";
import * as React from "react";
import { ArrowLeft, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import type {
  CategoryWithPartsDTO,
  PartDTO,
  PartVariantDTO,
  Selection,
  SelectionMap,
} from "@/lib/types";
import { formatYuan, formatWeight } from "@/lib/utils";
import { OrderForm } from "@/components/order-form";

function formatYuanRange(a: number, b: number) {
  return a === b ? formatYuan(a) : `${formatYuan(a)} ~ ${formatYuan(b)}`;
}

function selectionPrice(sel: Selection | undefined): number {
  if (!sel || sel.kind !== "part") return 0;
  return sel.variant?.sellPrice ?? sel.part.sellPrice;
}
function selectionWeight(sel: Selection | undefined): number {
  if (!sel || sel.kind !== "part") return 0;
  return sel.variant?.weight ?? sel.part.weight;
}

function buildVariantLabel(part: PartDTO, variant: PartVariantDTO): string {
  const idToValue = new Map<string, { optionName: string; value: string }>();
  for (const o of part.options) {
    for (const v of o.values) {
      idToValue.set(v.id, { optionName: o.name, value: v.value });
    }
  }
  return part.options
    .map((o) => {
      const id = variant.optionValueIds.find((vid) =>
        o.values.some((vv) => vv.id === vid),
      );
      const meta = id ? idToValue.get(id) : undefined;
      return meta ? `${meta.optionName}: ${meta.value}` : "";
    })
    .filter(Boolean)
    .join(" / ");
}

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
    for (const sel of Object.values(selection)) {
      if (!sel) continue;
      count += 1;
      price += selectionPrice(sel);
      weight += selectionWeight(sel);
    }
    return { count, price, weight };
  }, [selection]);

  const handlePick = (categoryId: string, sel: Selection | undefined) => {
    setSelection((prev) => ({ ...prev, [categoryId]: sel }));
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
              已选{" "}
              <span className="font-semibold text-foreground">
                {totals.count}
              </span>{" "}
              件
              {totals.weight > 0 && (
                <span className="ml-2">
                  约{" "}
                  <span className="font-semibold text-foreground">
                    {formatWeight(totals.weight)}
                  </span>
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
          <CategoryPickerContent
            category={openCategory}
            current={selection[openCategory.id]}
            onPick={(sel) => handlePick(openCategory.id, sel)}
            onClear={() => handlePick(openCategory.id, undefined)}
          />
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
  selected: Selection | undefined;
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
            selected.kind === "part" ? (
              <div className="mt-0.5 min-w-0">
                <div className="truncate font-medium">
                  {selected.part.brand} · {selected.part.name}
                </div>
                {selected.variantLabel && (
                  <div className="truncate text-xs text-muted-foreground">
                    {selected.variantLabel}
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-0.5 font-medium">其他</div>
            )
          ) : (
            <div className="mt-0.5 text-muted-foreground">
              {category.parts.length > 0
                ? `${category.parts.length} 个可选`
                : "可选「其他」"}
            </div>
          )}
        </div>
        <div className="ml-3 flex items-center gap-2">
          {selected && selected.kind === "part" && (
            <span className="text-sm font-semibold text-primary">
              {formatYuan(selectionPrice(selected))}
            </span>
          )}
          {selected && selected.kind === "other" && (
            <span className="text-sm text-muted-foreground">¥0</span>
          )}
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </button>
    </li>
  );
}

// ============ 分类选择内容（带规格子视图）============

type SubView =
  | { mode: "list" }
  | { mode: "variant"; part: PartDTO; selectedIndexes: number[] };

function CategoryPickerContent({
  category,
  current,
  onPick,
  onClear,
}: {
  category: CategoryWithPartsDTO;
  current: Selection | undefined;
  onPick: (sel: Selection) => void;
  onClear: () => void;
}) {
  const [view, setView] = React.useState<SubView>({ mode: "list" });

  // 每次打开新分类时回到列表态
  React.useEffect(() => {
    setView({ mode: "list" });
  }, [category.id]);

  function pickPart(part: PartDTO) {
    if (part.options.length === 0) {
      // 无规格 — 直接入选
      onPick({ kind: "part", part });
      return;
    }
    // 有规格 — 切到规格选择子视图，预选当前已选的组合（若是同一配件）或第一个组合
    let preselected: number[];
    if (
      current &&
      current.kind === "part" &&
      current.part.id === part.id &&
      current.variant
    ) {
      preselected = part.options.map((o) => {
        const idx = o.values.findIndex((v) =>
          current.variant!.optionValueIds.includes(v.id),
        );
        return idx >= 0 ? idx : 0;
      });
    } else {
      preselected = part.options.map(() => 0);
    }
    setView({ mode: "variant", part, selectedIndexes: preselected });
  }

  return (
    <DialogContent className="max-h-[80dvh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          {view.mode === "list" ? (
            <>选择 {category.name}</>
          ) : (
            <button
              type="button"
              onClick={() => setView({ mode: "list" })}
              className="flex items-center gap-1.5 text-base"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-muted-foreground">{category.name} ·</span>
              <span>{view.part.brand}</span>
              <span className="text-muted-foreground">{view.part.name}</span>
            </button>
          )}
        </DialogTitle>
      </DialogHeader>

      {view.mode === "list" ? (
        <PartList
          parts={category.parts}
          current={current}
          onPickPart={pickPart}
          onPickOther={() => onPick({ kind: "other" })}
          onClear={onClear}
        />
      ) : (
        <VariantPicker
          part={view.part}
          selectedIndexes={view.selectedIndexes}
          onChangeIndexes={(idxs) =>
            setView({ mode: "variant", part: view.part, selectedIndexes: idxs })
          }
          onConfirm={(variant) => {
            onPick({
              kind: "part",
              part: view.part,
              variant,
              variantLabel: buildVariantLabel(view.part, variant),
            });
          }}
        />
      )}
    </DialogContent>
  );
}

function PartList({
  parts,
  current,
  onPickPart,
  onPickOther,
  onClear,
}: {
  parts: PartDTO[];
  current: Selection | undefined;
  onPickPart: (part: PartDTO) => void;
  onPickOther: () => void;
  onClear: () => void;
}) {
  const otherActive = current?.kind === "other";
  const currentPartId = current?.kind === "part" ? current.part.id : null;

  return (
    <div className="space-y-2">
      {current && (
        <Button variant="outline" size="sm" onClick={onClear} className="w-full">
          取消选择
        </Button>
      )}

      {parts.map((p) => {
        const isCurrent = p.id === currentPartId;
        const hasVariants = p.variants.length > 0;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onPickPart(p)}
            className={`flex w-full items-start justify-between gap-3 rounded-md border p-3 text-left active:bg-accent ${
              isCurrent ? "border-primary bg-primary/5" : ""
            }`}
          >
            <div className="min-w-0 flex-1">
              <div className="font-medium">
                {p.brand} <span className="text-muted-foreground">·</span>{" "}
                {p.name}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {hasVariants
                  ? `${p.options
                      .map((o) => o.name)
                      .join(" / ")} · ${p.variants.length} 种规格`
                  : `${formatWeight(p.weight)}${p.note ? ` · ${p.note}` : ""}`}
              </div>
              {isCurrent && current?.kind === "part" && current.variantLabel && (
                <div className="mt-1 text-xs text-primary">
                  已选：{current.variantLabel}
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="font-semibold text-primary">
                {hasVariants
                  ? formatYuanRange(p.priceRange.min, p.priceRange.max)
                  : formatYuan(p.sellPrice)}
              </div>
              {hasVariants && (
                <div className="mt-0.5 text-xs text-muted-foreground">
                  点选规格
                </div>
              )}
            </div>
          </button>
        );
      })}

      <button
        type="button"
        onClick={onPickOther}
        className={`flex w-full items-start justify-between gap-3 rounded-md border p-3 text-left active:bg-accent ${
          otherActive ? "border-primary bg-primary/5" : ""
        }`}
      >
        <div className="min-w-0 flex-1">
          <div className="font-medium">其他</div>
          <div className="mt-1 text-xs text-muted-foreground">
            该分类不计入价格
          </div>
        </div>
        <div className="font-semibold text-muted-foreground">¥0</div>
      </button>
    </div>
  );
}

function VariantPicker({
  part,
  selectedIndexes,
  onChangeIndexes,
  onConfirm,
}: {
  part: PartDTO;
  selectedIndexes: number[];
  onChangeIndexes: (idxs: number[]) => void;
  onConfirm: (variant: PartVariantDTO) => void;
}) {
  // 把每个 variant 按 sorted optionValueIds 索引，方便按当前选择查找
  const variantByKey = React.useMemo(() => {
    const m = new Map<string, PartVariantDTO>();
    for (const v of part.variants) {
      const key = [...v.optionValueIds].sort().join("|");
      m.set(key, v);
    }
    return m;
  }, [part]);

  const currentVariant = React.useMemo(() => {
    const ids = selectedIndexes.map(
      (vi, oi) => part.options[oi].values[vi]?.id,
    );
    if (ids.some((x) => !x)) return undefined;
    const key = [...ids].sort().join("|");
    return variantByKey.get(key);
  }, [selectedIndexes, part, variantByKey]);

  function toggle(optionIdx: number, valueIdx: number) {
    onChangeIndexes(
      selectedIndexes.map((cur, i) => (i === optionIdx ? valueIdx : cur)),
    );
  }

  return (
    <div className="space-y-5">
      <div className="space-y-4">
        {part.options.map((opt, oi) => (
          <div key={opt.id} className="space-y-2">
            <div className="text-sm font-medium">
              {opt.name}
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                {opt.values[selectedIndexes[oi]]?.value}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {opt.values.map((v, vi) => {
                const isActive = selectedIndexes[oi] === vi;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => toggle(oi, vi)}
                    className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                      isActive
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input bg-background active:bg-accent"
                    }`}
                  >
                    {v.value}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="sticky bottom-0 -mx-6 -mb-6 border-t bg-background px-6 py-3">
        {currentVariant ? (
          <>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {formatWeight(currentVariant.weight)}
              </span>
              <span className="text-xl font-bold text-primary">
                {formatYuan(currentVariant.sellPrice)}
              </span>
            </div>
            <Button
              size="lg"
              className="w-full"
              onClick={() => onConfirm(currentVariant)}
            >
              确认选择
            </Button>
          </>
        ) : (
          <Button size="lg" className="w-full" disabled>
            该组合暂不可选
          </Button>
        )}
      </div>
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
