import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@folding-bike/db";

export const runtime = "nodejs";

// 规格 payload：客户端按"索引引用"声明变体，避免在 create 时还没有 id 的尴尬。
const OptionInput = z.object({
  name: z.string().min(1).max(30),
  values: z.array(z.string().min(1).max(30)).min(1).max(20),
});

const VariantInput = z.object({
  // 长度必须 = options.length；每个数字是对应 option.values 的下标
  valueIndexes: z.array(z.number().int().min(0)).min(1).max(5),
  costPrice: z.coerce.number().int().min(0).max(10_000_000),
  sellPrice: z.coerce.number().int().min(0).max(10_000_000),
  weight: z.coerce.number().int().min(0).max(100_000),
  active: z.boolean().default(true),
});

const Body = z.object({
  categoryId: z.string().min(1),
  brand: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  costPrice: z.coerce.number().int().min(0).max(10_000_000),
  sellPrice: z.coerce.number().int().min(0).max(10_000_000),
  weight: z.coerce.number().int().min(0).max(100_000),
  note: z.string().max(500).nullable().optional(),
  active: z.boolean().default(true),
  options: z.array(OptionInput).max(5).default([]),
  variants: z.array(VariantInput).max(100).default([]),
});

export async function POST(req: Request) {
  let body;
  try {
    body = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "参数有误" }, { status: 400 });
  }

  if (body.options.length > 0 && body.variants.length === 0) {
    return NextResponse.json(
      { error: "已定义规格项，必须至少有一个变体" },
      { status: 400 },
    );
  }
  for (const v of body.variants) {
    if (v.valueIndexes.length !== body.options.length) {
      return NextResponse.json(
        { error: "变体规格维度与规格项数量不匹配" },
        { status: 400 },
      );
    }
    for (let i = 0; i < v.valueIndexes.length; i++) {
      if (v.valueIndexes[i] >= body.options[i].values.length) {
        return NextResponse.json(
          { error: "变体引用了不存在的规格取值" },
          { status: 400 },
        );
      }
    }
  }

  const created = await prisma.$transaction(async (tx) => {
    const part = await tx.part.create({
      data: {
        categoryId: body.categoryId,
        brand: body.brand,
        name: body.name,
        costPrice: body.costPrice,
        sellPrice: body.sellPrice,
        weight: body.weight,
        note: body.note ?? null,
        active: body.active,
      },
    });

    // option/value id 矩阵：valueIds[optionIdx][valueIdx]
    const valueIds: string[][] = [];
    for (let oi = 0; oi < body.options.length; oi++) {
      const optInput = body.options[oi];
      const opt = await tx.partOption.create({
        data: { partId: part.id, name: optInput.name, sortOrder: oi },
      });
      const row: string[] = [];
      for (let vi = 0; vi < optInput.values.length; vi++) {
        const val = await tx.partOptionValue.create({
          data: { optionId: opt.id, value: optInput.values[vi], sortOrder: vi },
        });
        row.push(val.id);
      }
      valueIds.push(row);
    }

    for (const v of body.variants) {
      await tx.partVariant.create({
        data: {
          partId: part.id,
          costPrice: v.costPrice,
          sellPrice: v.sellPrice,
          weight: v.weight,
          active: v.active,
          values: {
            create: v.valueIndexes.map((vi, oi) => ({
              optionValueId: valueIds[oi][vi],
            })),
          },
        },
      });
    }

    return part;
  });

  return NextResponse.json(created, { status: 201 });
}
