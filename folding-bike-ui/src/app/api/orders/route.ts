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
        z.object({
          kind: z.literal("part"),
          partId: z.string().min(1),
          variantId: z.string().min(1).optional(),
        }),
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

  const partItems = parsed.items.filter(
    (i): i is { kind: "part"; partId: string; variantId?: string } =>
      i.kind === "part",
  );
  const otherCategoryIds = parsed.items
    .filter(
      (i): i is { kind: "other"; categoryId: string } => i.kind === "other",
    )
    .map((i) => i.categoryId);

  const partIds = partItems.map((i) => i.partId);

  const [parts, otherCategories] = await Promise.all([
    partIds.length > 0
      ? prisma.part.findMany({
          where: { id: { in: partIds }, active: true },
          include: {
            category: true,
            options: {
              orderBy: { sortOrder: "asc" },
              include: { values: { orderBy: { sortOrder: "asc" } } },
            },
            variants: {
              where: { active: true },
              include: { values: true },
            },
          },
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
  const partById = new Map(parts.map((p) => [p.id, p]));
  for (const item of partItems) {
    const p = partById.get(item.partId);
    if (!p) continue;
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

  // 构造各 item 快照：有 variant 用变体价格 + 标签，无则用 part 自带。
  try {
    const partItemSnapshots = partItems.map((item) => {
    const p = partById.get(item.partId)!;
    const requiresVariant = p.options.length > 0;

    if (requiresVariant) {
      if (!item.variantId) {
        throw new HttpError(400, `「${p.brand} ${p.name}」需要选择规格`);
      }
      const variant = p.variants.find((v) => v.id === item.variantId);
      if (!variant) {
        throw new HttpError(
          409,
          `「${p.brand} ${p.name}」选中的规格已失效，请刷新后重试`,
        );
      }
      // 生成快照标签 "材质: 钛合金 / 涂装: 哑光黑"
      const idToOpt = new Map<
        string,
        { optionName: string; value: string; optionSort: number }
      >();
      for (const o of p.options) {
        for (const v of o.values) {
          idToOpt.set(v.id, {
            optionName: o.name,
            value: v.value,
            optionSort: o.sortOrder,
          });
        }
      }
      const labelParts = variant.values
        .map((vv) => idToOpt.get(vv.optionValueId))
        .filter((x): x is NonNullable<typeof x> => !!x)
        .sort((a, b) => a.optionSort - b.optionSort)
        .map((m) => `${m.optionName}: ${m.value}`);
      return {
        partId: p.id as string | null,
        variantId: variant.id as string | null,
        categoryName: p.category.name,
        brand: p.brand,
        name: p.name,
        variantLabel: labelParts.join(" / ") || null,
        costPrice: variant.costPrice,
        sellPrice: variant.sellPrice,
        weight: variant.weight,
      };
    }

    // 无规格
    if (item.variantId) {
      throw new HttpError(400, `「${p.brand} ${p.name}」不应附带规格`);
    }
    return {
      partId: p.id as string | null,
      variantId: null as string | null,
      categoryName: p.category.name,
      brand: p.brand,
      name: p.name,
      variantLabel: null as string | null,
      costPrice: p.costPrice,
      sellPrice: p.sellPrice,
      weight: p.weight,
    };
  });

    const otherSnapshots = otherCategoryIds.map((cid) => {
      const cat = otherCategories.find((c) => c.id === cid)!;
      return {
        partId: null as string | null,
        variantId: null as string | null,
        categoryName: cat.name,
        brand: "其他",
        name: "",
        variantLabel: null as string | null,
        costPrice: 0,
        sellPrice: 0,
        weight: 0,
      };
    });

    const allItems = [...partItemSnapshots, ...otherSnapshots];
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
  } catch (err) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}
