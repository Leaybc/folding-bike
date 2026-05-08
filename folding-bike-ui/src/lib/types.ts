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

export type SelectionMap = Record<string, PartDTO | undefined>; // categoryId -> part
