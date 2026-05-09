export type PartDTO = {
  id: string;
  brand: string;
  name: string;
  sellPrice: number;
  weight: number;
  note: string | null;
};

export type CategoryWithPartsDTO = {
  id: string;
  name: string;
  sortOrder: number;
  parts: PartDTO[];
};

// "其他" 是每个分类自带的虚拟选项，不入库；选中时按 0 元 / 0 克处理。
export type Selection =
  | { kind: "part"; part: PartDTO }
  | { kind: "other" };

export type SelectionMap = Record<string, Selection | undefined>;
