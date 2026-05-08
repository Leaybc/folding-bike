import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@folding-bike/db";

export const runtime = "nodejs";

const Body = z.object({
  categoryId: z.string().min(1),
  brand: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  costPrice: z.coerce.number().int().min(0).max(10_000_000),
  sellPrice: z.coerce.number().int().min(0).max(10_000_000),
  weight: z.coerce.number().int().min(0).max(100_000),
  note: z.string().max(500).nullable().optional(),
  active: z.boolean().default(true),
});

export async function POST(req: Request) {
  let body;
  try {
    body = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "参数有误" }, { status: 400 });
  }
  const part = await prisma.part.create({
    data: {
      ...body,
      note: body.note ?? null,
    },
  });
  return NextResponse.json(part, { status: 201 });
}
