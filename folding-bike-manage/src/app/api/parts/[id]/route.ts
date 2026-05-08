import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@folding-bike/db";

export const runtime = "nodejs";

const Body = z.object({
  categoryId: z.string().min(1).optional(),
  brand: z.string().min(1).max(50).optional(),
  name: z.string().min(1).max(100).optional(),
  costPrice: z.coerce.number().int().min(0).max(10_000_000).optional(),
  sellPrice: z.coerce.number().int().min(0).max(10_000_000).optional(),
  weight: z.coerce.number().int().min(0).max(100_000).optional(),
  note: z.string().max(500).nullable().optional(),
  active: z.boolean().optional(),
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
  const part = await prisma.part.update({ where: { id }, data: body });
  return NextResponse.json(part);
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  await prisma.part.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
