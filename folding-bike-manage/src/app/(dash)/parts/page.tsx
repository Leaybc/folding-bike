import { prisma } from "@folding-bike/db";
import { PartsManager } from "@/components/parts/parts-manager";

export const dynamic = "force-dynamic";

export default async function PartsPage() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      parts: {
        orderBy: [{ active: "desc" }, { brand: "asc" }, { name: "asc" }],
        include: {
          options: {
            orderBy: { sortOrder: "asc" },
            include: { values: { orderBy: { sortOrder: "asc" } } },
          },
          variants: {
            orderBy: { createdAt: "asc" },
            include: { values: true },
          },
        },
      },
    },
  });

  const data = categories.map((c) => ({
    id: c.id,
    name: c.name,
    sortOrder: c.sortOrder,
    parts: c.parts.map((p) => ({
      id: p.id,
      categoryId: p.categoryId,
      brand: p.brand,
      name: p.name,
      costPrice: p.costPrice,
      sellPrice: p.sellPrice,
      weight: p.weight,
      note: p.note,
      active: p.active,
      options: p.options.map((o) => ({
        id: o.id,
        name: o.name,
        sortOrder: o.sortOrder,
        values: o.values.map((v) => ({
          id: v.id,
          value: v.value,
          sortOrder: v.sortOrder,
        })),
      })),
      variants: p.variants.map((v) => ({
        id: v.id,
        costPrice: v.costPrice,
        sellPrice: v.sellPrice,
        weight: v.weight,
        active: v.active,
        optionValueIds: v.values.map((x) => x.optionValueId),
      })),
    })),
  }));

  return <PartsManager initialCategories={data} />;
}
