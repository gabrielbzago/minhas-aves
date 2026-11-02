import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date();
  const nowIso = now.toISOString();
  const reminderLimit = new Date(now);
  reminderLimit.setUTCDate(reminderLimit.getUTCDate() + 30);

  // 1) Notifica dentro do Apollo uma única vez, quando faltarem até 30 dias.
  const { data: dueForReminder, error: reminderReadError } = await admin.from("profiles")
    .select("id,current_period_end")
    .eq("subscription_status", "pix_active")
    .not("current_period_end", "is", null)
    .is("pix_expiry_notice_sent_at", null)
    .gt("current_period_end", nowIso)
    .lte("current_period_end", reminderLimit.toISOString());
  if (reminderReadError) {
    console.error("[expire-pix] reminder query", reminderReadError);
    return NextResponse.json({ error: "Falha ao consultar avisos de vencimento." }, { status: 500 });
  }

  let remindersSent = 0;
  for (const profile of dueForReminder || []) {
    const { error } = await admin.from("profiles")
      .update({ pix_expiry_notice_sent_at: nowIso })
      .eq("id", profile.id)
      .eq("subscription_status", "pix_active")
      .is("pix_expiry_notice_sent_at", null);
    if (error) {
      console.error("[expire-pix] reminder update", profile.id, error);
      return NextResponse.json({ error: "Falha ao registrar aviso de vencimento." }, { status: 500 });
    }
    remindersSent++;
  }

  // 2) No vencimento, remove apenas o acesso pago; os dados do criatório permanecem.
  const { data: expired, error: expireError } = await admin.from("profiles")
    .update({ plan: "free", subscription_status: "pix_expired" })
    .eq("subscription_status", "pix_active")
    .neq("plan", "free")
    .lt("current_period_end", nowIso)
    .select("id");
  if (expireError) {
    console.error("[expire-pix] expiration", expireError);
    return NextResponse.json({ error: "Falha ao expirar planos Pix." }, { status: 500 });
  }

  return NextResponse.json({ remindersSent, expired: expired?.length || 0 });
}
