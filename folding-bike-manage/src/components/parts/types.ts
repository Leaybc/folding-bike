export type PartOptionValueRow = {
  id: string;
  value: string;
  sortOrder: number;
};

export type PartOptionRow = {
  id: string;
  name: string;
  sortOrder: number;
  values: PartOptionValueRow[];
};

export type PartVariantRow = {
  id: string;
  costPrice: number;
  sellPrice: number;
  weight: number;
  active: boolean;
  // 长度等于 options.length，与 options[i].values 顺序对应
  optionValueIds: string[];
};

export type PartRow = {
  id: string;
  categoryId: string;
  brand: string;
  name: string;
  costPrice: number;
  sellPrice: number;
  weight: number;
  note: string | null;
  active: boolean;
  options: PartOptionRow[];
  variants: PartVariantRow[];
};

export type CategoryRow = {
  id: string;
  name: string;
  sortOrder: number;
  parts: PartRow[];
};
