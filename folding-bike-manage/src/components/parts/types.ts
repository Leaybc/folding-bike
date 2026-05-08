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
};

export type CategoryRow = {
  id: string;
  name: string;
  sortOrder: number;
  parts: PartRow[];
};
