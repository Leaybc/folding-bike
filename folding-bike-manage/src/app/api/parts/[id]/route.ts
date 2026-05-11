import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@folding-bike/db";

export const runtime = "nodejs";

const OptionInput = z.object({
  name: z.string().min(1).max(30),
  values: z.array(z.string().min(1).max(30)).min(1).max(20),
});

const VariantInput = z.object({
  valueIndexes: z.array(z.number().int().min(0)).min(1).max(5),
  costPrice: z.coerce.number().int().min(0).max(10_000_000),
  sellPrice: z.coerce.number().int().min(0).max(10_000_000),
  weight: z.coerce.number().int().min(0).max(100_000),
  active: z.boolean().default(true),
});

const Body = z.object({
  categoryId: z.string().min(1).optional(),
  brand: z.string().min(1).max(50).optional(),
  name: z.string().min(1).max(100).optional(),
  costPrice: z.coerce.number().int().min(0).max(10_000_000).optional(),
  sellPrice: z.coerce.number().int().min(0).max(10_000_000).optional(),
  weight: z.coerce.number().int().min(0).max(100_000).optional(),
  note: z.string().max(500).nullable().optional(),
  active: z.boolean().optional(),
  // options + variants 一起替换；只传 options 不传 variants 视为参数错误
  options: z.array(OptionInput).max(5).optional(),
  variants: z.array(VariantInput).max(100).optional(),
});

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  let body;
  try {
    body = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "参数有误" }, { status: 400 });
  }

  const wantsSpecUpdate =
    body.options !== undefined || body.variants !== undefined;
  if (wantsSpecUpdate) {
    if (body.options === undefined || body.variants === undefined) {
      return NextResponse.json(
        { error: "规格更新需同时提供 options 与 variants" },
        { status: 400 },
      );
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
  }

  const result = await prisma.$transaction(async (tx) => {
    // 1) 基本字段
    const { options, variants, ...basicRaw } = body;
    const basic = Object.fromEntries(
      Object.entries(basicRaw).filter(([, v]) => v !== undefined),
    );
    if (Object.keys(basic).length > 0) {
      await tx.part.update({ where: { id }, data: basic });
    }

    // 2) 规格替换（如果传了）
    if (wantsSpecUpdate && options && variants) {
      // 级联删除会带走 PartOptionValue / PartVariantValue / PartVariant，
      // OrderItem.variantId 因为 SetNull 会被置空（变体快照已存在 OrderItem 中，不丢历史）。
      await tx.partOption.deleteMany({ where: { partId: id } });
      await tx.partVariant.deleteMany({ where: { partId: id } });

      const valueIds: string[][] = [];
      for (let oi = 0; oi < options.length; oi++) {
        const optInput = options[oi];
        const opt = await tx.partOption.create({
          data: { partId: id, name: optInput.name, sortOrder: oi },
        });
        const row: string[] = [];
        for (let vi = 0; vi < optInput.values.length; vi++) {
          const val = await tx.partOptionValue.create({
            data: {
              optionId: opt.id,
              value: optInput.values[vi],
              sortOrder: vi,
            },
          });
          row.push(val.id);
        }
        valueIds.push(row);
      }

      for (const v of variants) {
        await tx.partVariant.create({
          data: {
            partId: id,
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
    }

    return tx.part.findUnique({ where: { id } });
  });

  return NextResponse.json(result);
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  await prisma.part.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
