import { NextResponse } from "next/server";
import { z } from "zod";
import { checkPassword, signSession, setSessionCookie } from "@/lib/auth";

export const runtime = "nodejs";

const Body = z.object({ password: z.string().min(1).max(200) });

export async function POST(req: Request) {
  let parsed;
  try {
    parsed = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "请求参数有误" }, { status: 400 });
  }

  // Tiny brute-force speed bump.
  await new Promise((r) => setTimeout(r, 250));

  if (!(await checkPassword(parsed.password))) {
    return NextResponse.json({ error: "密码错误" }, { status: 401 });
  }

  const token = await signSession();
  await setSessionCookie(token);
  return NextResponse.json({ ok: true });
}
