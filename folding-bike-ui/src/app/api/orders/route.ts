import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@folding-bike/db";

export const runtime = "nodejs";

const Body = z.object({
  customerName: z.string().min(1).max(50),
  phone: z.string().regex(/^1\d{10}$/),
  wechat: z.string().max(50).nullable().optional(),
  note: z.string().max(500).nullable().optional(),
  items: z
    .array(
      z.discriminatedUnion("kind", [
        z.object({ kind: z.literal("part"), partId: z.string().min(1) }),
        z.object({ kind: z.literal("other"), categoryId: z.string().min(1) }),
      ]),
    )
    .min(1)
    .max(50),
});

export async function POST(req: Request) {
  let parsed;
  try {
    parsed = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "请求参数有误" }, { status: 400 });
  }

  const partIds = parsed.items
    .filter((i): i is { kind: "part"; partId: string } => i.kind === "part")
    .map((i) => i.partId);
  const otherCategoryIds = parsed.items
    .filter(
      (i): i is { kind: "other"; categoryId: string } => i.kind === "other",
    )
    .map((i) => i.categoryId);

  const [parts, otherCategories] = await Promise.all([
    partIds.length > 0
      ? prisma.part.findMany({
          where: { id: { in: partIds }, active: true },
          include: { category: true },
        })
      : Promise.resolve([]),
    otherCategoryIds.length > 0
      ? prisma.category.findMany({
          where: { id: { in: otherCategoryIds } },
        })
      : Promise.resolve([]),
  ]);

  if (parts.length !== partIds.length) {
    return NextResponse.json(
      { error: "部分配件已下架，请刷新后重试" },
      { status: 409 },
    );
  }
  if (otherCategories.length !== new Set(otherCategoryIds).size) {
    return NextResponse.json(
      { error: "部分分类不存在，请刷新后重试" },
      { status: 409 },
    );
  }

  // De-dupe by category — only one entry per category.
  const seenCategory = new Set<string>();
  for (const p of parts) {
    if (seenCategory.has(p.categoryId)) {
      return NextResponse.json(
        { error: "同一分类下只能选择一个配件" },
        { status: 400 },
      );
    }
    seenCategory.add(p.categoryId);
  }
  for (const cid of otherCategoryIds) {
    if (seenCategory.has(cid)) {
      return NextResponse.json(
        { error: "同一分类下只能选择一个配件" },
        { status: 400 },
      );
    }
    seenCategory.add(cid);
  }

  const partItems = parts.map((p) => ({
    partId: p.id as string | null,
    categoryName: p.category.name,
    brand: p.brand,
    name: p.name,
    costPrice: p.costPrice,
    sellPrice: p.sellPrice,
    weight: p.weight,
  }));

  const otherItems = otherCategoryIds.map((cid) => {
    const cat = otherCategories.find((c) => c.id === cid)!;
    return {
      partId: null as string | null,
      categoryName: cat.name,
      brand: "其他",
      name: "",
      costPrice: 0,
      sellPrice: 0,
      weight: 0,
    };
  });

  const allItems = [...partItems, ...otherItems];
  const totalSell = allItems.reduce((s, i) => s + i.sellPrice, 0);
  const totalCost = allItems.reduce((s, i) => s + i.costPrice, 0);
  const totalWeight = allItems.reduce((s, i) => s + i.weight, 0);

  const order = await prisma.order.create({
    data: {
      customerName: parsed.customerName,
      phone: parsed.phone,
      wechat: parsed.wechat ?? null,
      note: parsed.note ?? null,
      totalSell,
      totalCost,
      profit: totalSell - totalCost,
      totalWeight,
      items: { create: allItems },
    },
    select: { id: true },
  });

  return NextResponse.json({ id: order.id }, { status: 201 });
}
