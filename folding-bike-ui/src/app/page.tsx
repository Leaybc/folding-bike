import { prisma } from "@folding-bike/db";
import { Configurator } from "@/components/configurator";
import type { CategoryWithPartsDTO } from "@/lib/types";

// ISR：配件列表缓存 60s，命中时跳过数据库查询，只算 CDN 静态响应。
// 管理端改完最多 60s 内全网用户都能看到。如需即时刷新，由 manage 端调
// /api/revalidate （见下文）。
export const revalidate = 60;

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
