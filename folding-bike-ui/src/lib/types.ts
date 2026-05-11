export type PartOptionValueDTO = {
  id: string;
  value: string;
};

export type PartOptionDTO = {
  id: string;
  name: string;
  values: PartOptionValueDTO[];
};

export type PartVariantDTO = {
  id: string;
  sellPrice: number;
  weight: number;
  // 与 options 顺序一致，每项是 optionValueId
  optionValueIds: string[];
};

export type PartDTO = {
  id: string;
  brand: string;
  name: string;
  sellPrice: number;
  weight: number;
  note: string | null;
  options: PartOptionDTO[];
  variants: PartVariantDTO[];
  // 给配件列表用：当 variants 非空时显示区间，否则显示单价
  priceRange: { min: number; max: number };
  weightRange: { min: number; max: number };
};

export type CategoryWithPartsDTO = {
  id: string;
  name: string;
  sortOrder: number;
  parts: PartDTO[];
};

// "其他" 是每个分类自带的虚拟选项，不入库；选中时按 0 元 / 0 克处理。
export type Selection =
  | {
      kind: "part";
      part: PartDTO;
      // 有规格的配件，variant 必填；无规格则缺省。
      variant?: PartVariantDTO;
      variantLabel?: string;
    }
  | { kind: "other" };

export type SelectionMap = Record<string, Selection | undefined>;
