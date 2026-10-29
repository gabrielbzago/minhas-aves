import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireUser } from "@/lib/auth";

export async function POST(req: Request) {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const ownerEmail = (process.env.OWNER_EMAIL || "gabrielbzago@gmail.com").trim().toLowerCase();
  const isOwner = profile?.role === "owner" || (user.email || "").trim().toLowerCase() === ownerEmail;
  if (!isOwner) return NextResponse.json({ error: "Apenas o owner pode usar o modo de validação." }, { status: 403 });
  let enabled = true;
  try { const body = await req.json(); enabled = body?.enabled !== false; } catch {}
  const store = await cookies();
  if (enabled) store.set("mc_creator_preview", "1", { httpOnly:true, sameSite:"lax", secure:process.env.NODE_ENV === "production", path:"/", maxAge:60*60*4 });
  else store.delete("mc_creator_preview");
  return NextResponse.json({ ok:true, enabled });
}
