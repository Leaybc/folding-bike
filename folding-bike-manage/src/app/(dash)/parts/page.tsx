import { prisma } from "@folding-bike/db";
import { PartsManager } from "@/components/parts/parts-manager";

export const dynamic = "force-dynamic";

export default async function PartsPage() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      parts: {
        orderBy: [{ active: "desc" }, { brand: "asc" }, { name: "asc" }],
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
    })),
  }));

  return <PartsManager initialCategories={data} />;
}
