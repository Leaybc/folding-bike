"use client";
import * as React from "react";
import { ArrowLeft, Check, ChevronRight, Sparkles } from "lucide-react";
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

function variantToIndexes(part: PartDTO, variant: PartVariantDTO): number[] {
  return part.options.map((o) =>
    o.values.findIndex((v) => variant.optionValueIds.includes(v.id)),
  );
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

  const pickedCount = totals.count;

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col bg-page">
      <header className="sticky top-0 z-10 bg-brand-gradient text-white shadow-md shadow-primary/20">
        <div className="flex items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-lg shadow-inner shadow-white/10 backdrop-blur">
              🚲
            </span>
            <div className="leading-tight">
              <h1 className="text-base font-semibold tracking-wide">
                折叠车 DIY
              </h1>
              <p className="text-[11px] text-white/75">
                自由搭配，打造你的专属配置
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/15 hover:text-white"
            onClick={handleReset}
          >
            清空
          </Button>
        </div>
      </header>

      <main className="flex-1 px-4 pb-32 pt-5">
        {categories.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              共 {categories.length} 个部件可选 · 已选{" "}
              <span className="font-semibold text-foreground">
                {pickedCount}
              </span>
            </div>
            <ul className="space-y-2.5">
              {categories.map((cat, idx) => (
                <CategoryRow
                  key={cat.id}
                  index={idx}
                  category={cat}
                  selected={selection[cat.id]}
                  onClick={() => setOpenCategory(cat)}
                />
              ))}
            </ul>
          </>
        )}
      </main>

      <footer className="fixed inset-x-0 bottom-0 z-10 border-t border-white/40 bg-background/85 shadow-[0_-8px_28px_-12px_rgba(15,23,42,0.12)] backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-3 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="leading-tight">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
              小计
              {totals.weight > 0 && (
                <span className="ml-2 normal-case tracking-normal">
                  · 约{" "}
                  <span className="font-semibold text-foreground">
                    {formatWeight(totals.weight)}
                  </span>
                </span>
              )}
            </div>
            <div className="bg-brand-gradient bg-clip-text text-2xl font-extrabold tracking-tight text-transparent">
              {formatYuan(totals.price)}
            </div>
          </div>
          <Button
            size="lg"
            onClick={handleSubmit}
            className="bg-brand-gradient text-white shadow-lg shadow-primary/30 transition-transform active:scale-95"
          >
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
  index,
  category,
  selected,
  onClick,
}: {
  index: number;
  category: CategoryWithPartsDTO;
  selected: Selection | undefined;
  onClick: () => void;
}) {
  const isPicked = !!selected;
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={`group flex w-full items-center justify-between gap-3 rounded-2xl border bg-card p-3.5 text-left shadow-sm shadow-slate-900/[0.03] transition-all active:scale-[0.99] active:bg-accent ${
          isPicked
            ? "border-primary/40 ring-1 ring-primary/20 shadow-primary/10"
            : "border-slate-200/80 hover:border-slate-300"
        }`}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold transition-colors ${
              isPicked
                ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            {isPicked ? (
              <Check className="h-5 w-5" strokeWidth={3} />
            ) : (
              String(index + 1).padStart(2, "0")
            )}
          </span>
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
              {category.name}
            </div>
            {selected ? (
              selected.kind === "part" ? (
                <div className="mt-0.5 min-w-0">
                  <div className="truncate font-medium leading-snug">
                    {selected.part.brand}{" "}
                    <span className="text-muted-foreground">·</span>{" "}
                    {selected.part.name}
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
              <div className="mt-0.5 text-sm text-muted-foreground">
                {category.parts.length > 0
                  ? `${category.parts.length} 个可选`
                  : "可选「其他」"}
              </div>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {selected && selected.kind === "part" && (
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-sm font-semibold text-primary">
              {formatYuan(selectionPrice(selected))}
            </span>
          )}
          {selected && selected.kind === "other" && (
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
              ¥0
            </span>
          )}
          <ChevronRight className="h-5 w-5 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
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
    // 有规格 — 必须落到一个真实存在的有效变体上：
    // 1) 同一配件之前选过 → 还原；
    // 2) 否则用第一条有效变体。
    let initial: number[] | null = null;
    if (
      current &&
      current.kind === "part" &&
      current.part.id === part.id &&
      current.variant
    ) {
      const v = part.variants.find((x) => x.id === current.variant!.id);
      if (v) initial = variantToIndexes(part, v);
    }
    if (!initial && part.variants.length > 0) {
      initial = variantToIndexes(part, part.variants[0]);
    }
    if (!initial) initial = part.options.map(() => 0);
    setView({ mode: "variant", part, selectedIndexes: initial });
  }

  return (
    <DialogContent className="max-h-[80dvh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          {view.mode === "list" ? (
            <div className="flex items-baseline gap-2">
              <span>选择</span>
              <span className="text-primary">{category.name}</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setView({ mode: "list" })}
              className="group flex items-center gap-2 text-base"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                <ArrowLeft className="h-4 w-4" />
              </span>
              <span className="flex items-baseline gap-1.5">
                <span className="text-xs text-muted-foreground">
                  {category.name}
                </span>
                <span className="font-semibold">{view.part.brand}</span>
                <span className="text-sm text-muted-foreground">
                  {view.part.name}
                </span>
              </span>
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
    <div className="space-y-2.5">
      {current && (
        <Button
          variant="outline"
          size="sm"
          onClick={onClear}
          className="w-full rounded-xl"
        >
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
            className={`flex w-full items-start justify-between gap-3 rounded-xl border p-3.5 text-left transition-all active:scale-[0.99] active:bg-accent ${
              isCurrent
                ? "border-primary/60 bg-primary/[0.04] ring-1 ring-primary/20 shadow-sm shadow-primary/10"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <div className="min-w-0 flex-1">
              <div className="font-medium leading-snug">
                {p.brand} <span className="text-muted-foreground">·</span>{" "}
                {p.name}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {hasVariants
                  ? `${p.options
                      .map((o) => o.name)
                      .join(" / ")} · ${p.variants.length} 种规格`
                  : formatWeight(p.weight)}
              </div>
              {p.note && (
                <div className="mt-1.5 line-clamp-2 text-xs text-muted-foreground/90">
                  {p.note}
                </div>
              )}
              {isCurrent && current?.kind === "part" && current.variantLabel && (
                <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                  <Check className="h-3 w-3" strokeWidth={3} />
                  {current.variantLabel}
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
                <div className="mt-0.5 text-[11px] text-muted-foreground">
                  点选规格 →
                </div>
              )}
            </div>
          </button>
        );
      })}

      <button
        type="button"
        onClick={onPickOther}
        className={`flex w-full items-start justify-between gap-3 rounded-xl border border-dashed p-3.5 text-left transition-all active:bg-accent ${
          otherActive
            ? "border-primary/60 bg-primary/[0.04] ring-1 ring-primary/20"
            : "border-slate-300 hover:border-slate-400"
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

  // 给定除 oi 外其它维度的当前选择，判断 oi=vi 是否有对应的有效变体
  function isPillVisible(oi: number, vi: number): boolean {
    for (const v of part.variants) {
      let ok = true;
      for (let k = 0; k < part.options.length; k++) {
        const idx = k === oi ? vi : selectedIndexes[k];
        const id = part.options[k].values[idx]?.id;
        if (!id || !v.optionValueIds.includes(id)) {
          ok = false;
          break;
        }
      }
      if (ok) return true;
    }
    return false;
  }

  function toggle(optionIdx: number, valueIdx: number) {
    onChangeIndexes(
      selectedIndexes.map((cur, i) => (i === optionIdx ? valueIdx : cur)),
    );
  }

  return (
    <div className="space-y-5">
      {part.note && (
        <div className="rounded-xl border border-primary/20 bg-primary/[0.04] px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
          {part.note}
        </div>
      )}

      <div className="space-y-4">
        {part.options.map((opt, oi) => {
          const visibleValues = opt.values
            .map((v, vi) => ({ v, vi }))
            .filter(({ vi }) => isPillVisible(oi, vi));
          return (
            <div key={opt.id} className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-medium">{opt.name}</span>
                <span className="text-xs font-medium text-primary">
                  {opt.values[selectedIndexes[oi]]?.value}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {visibleValues.map(({ v, vi }) => {
                  const isActive = selectedIndexes[oi] === vi;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => toggle(oi, vi)}
                      className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-all active:scale-95 ${
                        isActive
                          ? "border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                          : "border-slate-200 bg-background text-foreground hover:border-slate-300 active:bg-accent"
                      }`}
                    >
                      {v.value}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="sticky bottom-0 -mx-6 -mb-6 border-t bg-background/95 px-6 py-3 backdrop-blur">
        {currentVariant ? (
          <>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                重量约 {formatWeight(currentVariant.weight)}
              </span>
              <span className="bg-brand-gradient bg-clip-text text-2xl font-extrabold tracking-tight text-transparent">
                {formatYuan(currentVariant.sellPrice)}
              </span>
            </div>
            <Button
              size="lg"
              className="w-full bg-brand-gradient text-white shadow-md shadow-primary/30 transition-transform active:scale-[0.98]"
              onClick={() => onConfirm(currentVariant)}
            >
              确认选择
            </Button>
          </>
        ) : (
          <Button size="lg" className="w-full" disabled>
            暂无可选规格
          </Button>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-24 flex flex-col items-center text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-gradient text-3xl shadow-lg shadow-primary/20">
        🛠️
      </div>
      <h2 className="mt-4 text-lg font-semibold">配件还在筹备中</h2>
      <p className="mt-1.5 max-w-[260px] text-sm text-muted-foreground">
        管理员还没有添加任何配件分类。请稍后再来看看～
      </p>
    </div>
  );
}
