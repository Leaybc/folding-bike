import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@folding-bike/db";

export const runtime = "nodejs";

const Body = z.object({
  name: z.string().min(1).max(50),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(100),
});

export async function POST(req: Request) {
  let body;
  try {
    body = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "参数有误" }, { status: 400 });
  }
  try {
    const cat = await prisma.category.create({ data: body });
    return NextResponse.json(cat, { status: 201 });
  } catch (e: unknown) {
    if (
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      (e as { code?: string }).code === "P2002"
    ) {
      return NextResponse.json({ error: "分类名已存在" }, { status: 409 });
    }
    throw e;
  }
}
