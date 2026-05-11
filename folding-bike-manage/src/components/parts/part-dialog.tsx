"use client";
import * as React from "react";
import { Plus, X, Wand2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

type OptionDraft = { name: string; values: string[] };
type VariantDraft = {
  costPrice: number;
  sellPrice: number;
  weight: number;
  active: boolean;
};

// 组合签名：把每个 option 选用的 value 下标用 "/" 连起来，如 "0/1"
function comboKey(indexes: number[]): string {
  return indexes.join("/");
}

function cartesianIndexes(options: OptionDraft[]): number[][] {
  if (options.length === 0) return [];
  let acc: number[][] = [[]];
  for (const opt of options) {
    const next: number[][] = [];
    for (const prefix of acc) {
      for (let i = 0; i < opt.values.length; i++) {
        next.push([...prefix, i]);
      }
    }
    acc = next;
  }
  return acc;
}

function buildInitialFromEditing(part: PartRow): {
  options: OptionDraft[];
  variants: Record<string, VariantDraft>;
} {
  const options: OptionDraft[] = part.options.map((o) => ({
    name: o.name,
    values: o.values.map((v) => v.value),
  }));
  // valueId → optionIdx,valueIdx
  const valueIdToIdx = new Map<string, { oi: number; vi: number }>();
  part.options.forEach((o, oi) =>
    o.values.forEach((v, vi) => valueIdToIdx.set(v.id, { oi, vi })),
  );
  const variants: Record<string, VariantDraft> = {};
  for (const v of part.variants) {
    const indexes = new Array<number>(options.length).fill(-1);
    let bad = false;
    for (const vid of v.optionValueIds) {
      const m = valueIdToIdx.get(vid);
      if (!m) {
        bad = true;
        break;
      }
      indexes[m.oi] = m.vi;
    }
    if (bad || indexes.some((x) => x < 0)) continue;
    variants[comboKey(indexes)] = {
      costPrice: v.costPrice,
      sellPrice: v.sellPrice,
      weight: v.weight,
      active: v.active,
    };
  }
  return { options, variants };
}

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
  const [tab, setTab] = React.useState<"basic" | "spec">("basic");
  const toast = useToast();

  // 基本字段
  const [categoryId, setCategoryId] = React.useState("");
  const [brand, setBrand] = React.useState("");
  const [name, setName] = React.useState("");
  const [costPrice, setCostPrice] = React.useState(0);
  const [sellPrice, setSellPrice] = React.useState(0);
  const [weight, setWeight] = React.useState(0);
  const [note, setNote] = React.useState("");
  const [active, setActive] = React.useState(true);

  // 规格
  const [options, setOptions] = React.useState<OptionDraft[]>([]);
  const [variants, setVariants] = React.useState<
    Record<string, VariantDraft>
  >({});

  // 打开时初始化所有字段
  React.useEffect(() => {
    if (!state) return;
    setTab("basic");
    if (state.mode === "new") {
      setCategoryId(state.categoryId);
      setBrand("");
      setName("");
      setCostPrice(0);
      setSellPrice(0);
      setWeight(0);
      setNote("");
      setActive(true);
      setOptions([]);
      setVariants({});
    } else {
      const p = state.part;
      setCategoryId(p.categoryId);
      setBrand(p.brand);
      setName(p.name);
      setCostPrice(p.costPrice);
      setSellPrice(p.sellPrice);
      setWeight(p.weight);
      setNote(p.note ?? "");
      setActive(p.active);
      const init = buildInitialFromEditing(p);
      setOptions(init.options);
      setVariants(init.variants);
    }
  }, [state]);

  // 当前所有有效组合（按当前 options 计算）
  const combos = React.useMemo(() => cartesianIndexes(options), [options]);

  // 当 options 变化时，自动补齐缺失的 variant（用兜底价），并移除失效的
  React.useEffect(() => {
    if (options.length === 0) {
      if (Object.keys(variants).length > 0) setVariants({});
      return;
    }
    setVariants((prev) => {
      const validKeys = new Set(combos.map(comboKey));
      const next: Record<string, VariantDraft> = {};
      for (const k of validKeys) {
        next[k] =
          prev[k] ?? {
            costPrice,
            sellPrice,
            weight,
            active: true,
          };
      }
      // 如果完全相同则保持引用，避免 re-render
      const sameKeys =
        Object.keys(next).length === Object.keys(prev).length &&
        Object.keys(next).every((k) => prev[k] === next[k]);
      return sameKeys ? prev : next;
    });
    // 仅在 combos 变时触发，兜底价用最新值
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [combos]);

  // -------- options 编辑动作 --------
  function addOption() {
    if (options.length >= 5) {
      toast.show("最多 5 个规格项", { tone: "error" });
      return;
    }
    setOptions((prev) => [...prev, { name: "", values: [""] }]);
  }
  function removeOption(idx: number) {
    setOptions((prev) => prev.filter((_, i) => i !== idx));
  }
  function renameOption(idx: number, newName: string) {
    setOptions((prev) =>
      prev.map((o, i) => (i === idx ? { ...o, name: newName } : o)),
    );
  }
  function setOptionValue(oi: number, vi: number, newVal: string) {
    setOptions((prev) =>
      prev.map((o, i) =>
        i === oi
          ? { ...o, values: o.values.map((v, j) => (j === vi ? newVal : v)) }
          : o,
      ),
    );
  }
  function addOptionValue(oi: number) {
    setOptions((prev) =>
      prev.map((o, i) =>
        i === oi ? { ...o, values: [...o.values, ""] } : o,
      ),
    );
  }
  function removeOptionValue(oi: number, vi: number) {
    setOptions((prev) =>
      prev.map((o, i) =>
        i === oi ? { ...o, values: o.values.filter((_, j) => j !== vi) } : o,
      ),
    );
  }

  // -------- variants 编辑 --------
  function updateVariant(key: string, patch: Partial<VariantDraft>) {
    setVariants((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  }
  function applyBasePriceToAll() {
    setVariants((prev) => {
      const next: Record<string, VariantDraft> = {};
      for (const k of Object.keys(prev)) {
        next[k] = {
          ...prev[k],
          costPrice,
          sellPrice,
          weight,
        };
      }
      return next;
    });
    toast.show("已套用基础价");
  }

  // -------- 提交 --------
  async function handleSubmit() {
    if (submitting) return;

    // 基本校验
    if (!categoryId) {
      toast.show("请选择分类", { tone: "error" });
      setTab("basic");
      return;
    }
    if (!brand.trim() || !name.trim()) {
      toast.show("请填写品牌与型号", { tone: "error" });
      setTab("basic");
      return;
    }
    if (costPrice < 0 || sellPrice < 0 || weight < 0) {
      toast.show("价格 / 重量不能为负", { tone: "error" });
      setTab("basic");
      return;
    }

    // 规格校验
    const cleanedOptions: OptionDraft[] = [];
    for (let oi = 0; oi < options.length; oi++) {
      const o = options[oi];
      const name = o.name.trim();
      const values = o.values.map((v) => v.trim()).filter((v) => v.length > 0);
      if (!name) {
        toast.show(`第 ${oi + 1} 个规格项缺少名称`, { tone: "error" });
        setTab("spec");
        return;
      }
      if (values.length === 0) {
        toast.show(`「${name}」至少要有一个取值`, { tone: "error" });
        setTab("spec");
        return;
      }
      const dupSet = new Set<string>();
      for (const v of values) {
        if (dupSet.has(v)) {
          toast.show(`「${name}」中取值「${v}」重复`, { tone: "error" });
          setTab("spec");
          return;
        }
        dupSet.add(v);
      }
      cleanedOptions.push({ name, values });
    }

    // 重新基于清洗后的 options 算 combos（trim 不会改变索引）
    const cleanedCombos = cartesianIndexes(cleanedOptions);

    const variantsPayload = cleanedCombos.map((idxArr) => {
      const k = comboKey(idxArr);
      const v = variants[k] ?? {
        costPrice,
        sellPrice,
        weight,
        active: true,
      };
      return {
        valueIndexes: idxArr,
        costPrice: Number(v.costPrice) || 0,
        sellPrice: Number(v.sellPrice) || 0,
        weight: Number(v.weight) || 0,
        active: v.active,
      };
    });

    const payload = {
      categoryId,
      brand: brand.trim(),
      name: name.trim(),
      costPrice,
      sellPrice,
      weight,
      note: note.trim() || null,
      active,
      options: cleanedOptions,
      variants: variantsPayload,
    };

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

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isNew ? "添加配件" : "编辑配件"}</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as "basic" | "spec")}>
          <TabsList>
            <TabsTrigger value="basic">基本信息</TabsTrigger>
            <TabsTrigger value="spec">
              规格
              {options.length > 0 && (
                <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 text-xs text-primary">
                  {options.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="categoryId">所属分类 *</Label>
                <select
                  id="categoryId"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
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
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">型号 / 名称 *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="costPrice">
                  进价（元）{options.length > 0 ? " · 兜底" : " *"}
                </Label>
                <Input
                  id="costPrice"
                  type="number"
                  min={0}
                  step={1}
                  value={costPrice}
                  onChange={(e) => setCostPrice(Number(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sellPrice">
                  售价（元）{options.length > 0 ? " · 兜底" : " *"}
                </Label>
                <Input
                  id="sellPrice"
                  type="number"
                  min={0}
                  step={1}
                  value={sellPrice}
                  onChange={(e) => setSellPrice(Number(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">
                  重量（克）{options.length > 0 ? " · 兜底" : ""}
                </Label>
                <Input
                  id="weight"
                  type="number"
                  min={0}
                  step={1}
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value) || 0)}
                />
              </div>
              <div className="flex items-center gap-2 sm:col-span-1">
                <input
                  id="active"
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="active">在售（用户可见）</Label>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="note">备注</Label>
                <Textarea
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                />
              </div>
              {options.length > 0 && (
                <div className="rounded-md border bg-secondary/30 p-3 text-xs text-muted-foreground sm:col-span-2">
                  该配件已配置规格，最终价格以「规格」标签页中的变体为准；基础进价 /
                  售价 / 重量仅作为新增变体时的默认值。
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="spec" className="space-y-4">
            <SpecEditor
              options={options}
              variants={variants}
              combos={combos}
              baseCostPrice={costPrice}
              baseSellPrice={sellPrice}
              baseWeight={weight}
              onAddOption={addOption}
              onRemoveOption={removeOption}
              onRenameOption={renameOption}
              onSetOptionValue={setOptionValue}
              onAddOptionValue={addOptionValue}
              onRemoveOptionValue={removeOptionValue}
              onUpdateVariant={updateVariant}
              onApplyBasePrice={applyBasePriceToAll}
            />
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={submitting}
          >
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "保存中…" : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============ 规格编辑子组件 ============

function SpecEditor({
  options,
  variants,
  combos,
  baseCostPrice,
  baseSellPrice,
  baseWeight,
  onAddOption,
  onRemoveOption,
  onRenameOption,
  onSetOptionValue,
  onAddOptionValue,
  onRemoveOptionValue,
  onUpdateVariant,
  onApplyBasePrice,
}: {
  options: OptionDraft[];
  variants: Record<string, VariantDraft>;
  combos: number[][];
  baseCostPrice: number;
  baseSellPrice: number;
  baseWeight: number;
  onAddOption: () => void;
  onRemoveOption: (idx: number) => void;
  onRenameOption: (idx: number, newName: string) => void;
  onSetOptionValue: (oi: number, vi: number, val: string) => void;
  onAddOptionValue: (oi: number) => void;
  onRemoveOptionValue: (oi: number, vi: number) => void;
  onUpdateVariant: (key: string, patch: Partial<VariantDraft>) => void;
  onApplyBasePrice: () => void;
}) {
  if (options.length === 0) {
    return (
      <div className="rounded-md border border-dashed py-10 text-center">
        <p className="text-sm text-muted-foreground">
          没有规格项。绝大多数配件都不需要规格，直接在「基本信息」填好价格即可。
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          例如车架这种「不同材质 / 涂装价格不同」的配件，才需要新增规格。
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="mt-4"
          onClick={onAddOption}
        >
          <Plus className="h-4 w-4" />
          新增规格项
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* 规格项 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">规格项</h3>
          <Button type="button" size="sm" variant="outline" onClick={onAddOption}>
            <Plus className="h-4 w-4" />
            新增规格项
          </Button>
        </div>
        {options.map((o, oi) => (
          <div
            key={oi}
            className="space-y-2 rounded-md border bg-background p-3"
          >
            <div className="flex items-center gap-2">
              <Input
                placeholder={`规格名（例如 材质）`}
                value={o.name}
                onChange={(e) => onRenameOption(oi, e.target.value)}
                className="max-w-xs"
              />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => onRemoveOption(oi)}
                title="删除该规格项"
              >
                <X className="h-4 w-4 text-destructive" />
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {o.values.map((v, vi) => (
                <div
                  key={vi}
                  className="flex items-center gap-1 rounded-full border bg-secondary/40 pl-3 pr-1 py-1"
                >
                  <input
                    value={v}
                    onChange={(e) => onSetOptionValue(oi, vi, e.target.value)}
                    placeholder="取值"
                    size={Math.max(v.length, 4)}
                    className="bg-transparent text-sm outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => onRemoveOptionValue(oi, vi)}
                    className="rounded-full p-0.5 text-muted-foreground hover:bg-background hover:text-destructive"
                    title="删除取值"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => onAddOptionValue(oi)}
                className="h-7"
              >
                <Plus className="h-3 w-3" />
                添加取值
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* 变体价格表 */}
      {combos.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">
              变体价格
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                共 {combos.length} 个组合
              </span>
            </h3>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onApplyBasePrice}
              title={`套用 进价${baseCostPrice} / 售价${baseSellPrice} / 重量${baseWeight}`}
            >
              <Wand2 className="h-4 w-4" />
              套用基础价
            </Button>
          </div>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-secondary/40 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-normal">组合</th>
                  <th className="w-24 px-2 py-2 font-normal">进价</th>
                  <th className="w-24 px-2 py-2 font-normal">售价</th>
                  <th className="w-24 px-2 py-2 font-normal">重量</th>
                  <th className="w-16 px-2 py-2 font-normal">启用</th>
                </tr>
              </thead>
              <tbody>
                {combos.map((idxArr) => {
                  const key = comboKey(idxArr);
                  const v = variants[key] ?? {
                    costPrice: baseCostPrice,
                    sellPrice: baseSellPrice,
                    weight: baseWeight,
                    active: true,
                  };
                  const label = idxArr
                    .map((vi, oi) => {
                      const opt = options[oi];
                      const val = opt.values[vi];
                      return `${opt.name || "?"}: ${val || "?"}`;
                    })
                    .join(" / ");
                  return (
                    <tr key={key} className="border-t">
                      <td className="px-3 py-2">{label}</td>
                      <td className="px-2 py-1">
                        <Input
                          type="number"
                          min={0}
                          value={v.costPrice}
                          onChange={(e) =>
                            onUpdateVariant(key, {
                              costPrice: Number(e.target.value) || 0,
                            })
                          }
                          className="h-8"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <Input
                          type="number"
                          min={0}
                          value={v.sellPrice}
                          onChange={(e) =>
                            onUpdateVariant(key, {
                              sellPrice: Number(e.target.value) || 0,
                            })
                          }
                          className="h-8"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <Input
                          type="number"
                          min={0}
                          value={v.weight}
                          onChange={(e) =>
                            onUpdateVariant(key, {
                              weight: Number(e.target.value) || 0,
                            })
                          }
                          className="h-8"
                        />
                      </td>
                      <td className="px-2 py-1 text-center">
                        <input
                          type="checkbox"
                          checked={v.active}
                          onChange={(e) =>
                            onUpdateVariant(key, { active: e.target.checked })
                          }
                          className="h-4 w-4"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
