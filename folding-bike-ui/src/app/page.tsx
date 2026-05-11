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
        include: {
          options: {
            orderBy: { sortOrder: "asc" },
            include: { values: { orderBy: { sortOrder: "asc" } } },
          },
          variants: {
            where: { active: true },
            orderBy: { createdAt: "asc" },
            include: { values: true },
          },
        },
      },
    },
  });

  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    sortOrder: c.sortOrder,
    parts: c.parts.map((p) => {
      const hasVariants = p.variants.length > 0;
      const sellPrices = hasVariants
        ? p.variants.map((v) => v.sellPrice)
        : [p.sellPrice];
      const weights = hasVariants
        ? p.variants.map((v) => v.weight)
        : [p.weight];
      return {
        id: p.id,
        brand: p.brand,
        name: p.name,
        sellPrice: p.sellPrice,
        weight: p.weight,
        note: p.note,
        options: p.options.map((o) => ({
          id: o.id,
          name: o.name,
          values: o.values.map((v) => ({ id: v.id, value: v.value })),
        })),
        variants: p.variants.map((v) => ({
          id: v.id,
          sellPrice: v.sellPrice,
          weight: v.weight,
          optionValueIds: v.values.map((x) => x.optionValueId),
        })),
        priceRange: {
          min: Math.min(...sellPrices),
          max: Math.max(...sellPrices),
        },
        weightRange: {
          min: Math.min(...weights),
          max: Math.max(...weights),
        },
      };
    }),
  }));
}

export default async function Home() {
  const categories = await loadCategories();
  return <Configurator categories={categories} />;
}
