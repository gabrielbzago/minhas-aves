import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { data, error } = await admin.from("profiles")
    .update({ plan: "free", subscription_status: "pix_expired" })
    .eq("subscription_status", "pix_active")
    .neq("plan", "free")
    .lt("current_period_end", now)
    .select("id");
  if (error) {
    console.error("[expire-pix]", error);
    return NextResponse.json({ error: "Falha ao expirar planos Pix." }, { status: 500 });
  }
  return NextResponse.json({ expired: data?.length || 0 });
}
