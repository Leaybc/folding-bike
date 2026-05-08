import { prisma } from "@folding-bike/db";
import { Configurator } from "@/components/configurator";
import type { CategoryWithPartsDTO } from "@/lib/types";

// Always fetch fresh — admin changes should reflect immediately.
export const dynamic = "force-dynamic";

async function loadCategories(): Promise<CategoryWithPartsDTO[]> {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      parts: {
        where: { active: true },
        orderBy: [{ brand: "asc" }, { name: "asc" }],
      },
    },
  });

  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    sortOrder: c.sortOrder,
    parts: c.parts.map((p) => ({
      id: p.id,
      brand: p.brand,
      name: p.name,
      sellPrice: p.sellPrice,
      weight: p.weight,
      note: p.note,
    })),
  }));
}

export default async function Home() {
  const categories = await loadCategories();
  return <Configurator categories={categories} />;
}
