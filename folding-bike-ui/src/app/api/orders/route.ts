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
    .array(z.object({ partId: z.string().min(1) }))
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

  const partIds = parsed.items.map((i) => i.partId);
  const parts = await prisma.part.findMany({
    where: { id: { in: partIds }, active: true },
    include: { category: true },
  });

  if (parts.length !== partIds.length) {
    return NextResponse.json(
      { error: "部分配件已下架，请刷新后重试" },
      { status: 409 },
    );
  }

  // De-dupe by category — only one part per category is allowed.
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

  const totalSell = parts.reduce((s, p) => s + p.sellPrice, 0);
  const totalCost = parts.reduce((s, p) => s + p.costPrice, 0);
  const totalWeight = parts.reduce((s, p) => s + p.weight, 0);

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
      items: {
        create: parts.map((p) => ({
          partId: p.id,
          categoryName: p.category.name,
          brand: p.brand,
          name: p.name,
          costPrice: p.costPrice,
          sellPrice: p.sellPrice,
          weight: p.weight,
        })),
      },
    },
    select: { id: true },
  });

  return NextResponse.json({ id: order.id }, { status: 201 });
}
