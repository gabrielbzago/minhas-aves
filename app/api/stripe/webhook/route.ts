import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import Stripe from "stripe";

function unixDate(value: number | null | undefined) {
  return value ? new Date(value * 1000).toISOString() : null;
}

function isEntitledStatus(status: Stripe.Subscription.Status | string | null | undefined) {
  return status === "active" || status === "trialing";
}

function invoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const raw = invoice as any;
  const value = raw.subscription ?? raw.parent?.subscription_details?.subscription ?? null;
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && typeof value.id === "string") return value.id;
  return null;
}

async function findProfileForSubscription(admin: ReturnType<typeof createAdminClient>, sub: Stripe.Subscription) {
  const metadataUserId = sub.metadata?.user_id;
  if (metadataUserId) {
    const { data } = await admin
      .from("profiles")
      .select("id,plan,stripe_subscription_id,stripe_customer_id,current_period_start")
      .eq("id", metadataUserId)
      .maybeSingle();
    if (data) return data;
  }
  const { data } = await admin
    .from("profiles")
    .select("id,plan,stripe_subscription_id,stripe_customer_id,current_period_start")
    .eq("stripe_subscription_id", sub.id)
    .maybeSingle();
  return data;
}

async function applySubscriptionState(
  admin: ReturnType<typeof createAdminClient>,
  sub: Stripe.Subscription,
  eventType: string,
) {
  const profile = await findProfileForSubscription(admin, sub);
  if (!profile) {
    console.warn("Stripe subscription sem perfil associado:", sub.id);
    return;
  }

  // Uma assinatura antiga não pode bloquear uma nova assinatura já vinculada ao perfil.
  if (profile.stripe_subscription_id && profile.stripe_subscription_id !== sub.id) return;

  const entitled = isEntitledStatus(sub.status);
  const plan = entitled && ["amador", "profissional", "lenda"].includes(sub.metadata?.plan || "")
    ? sub.metadata!.plan!
    : "free";
  const periodStart = unixDate(sub.current_period_start);
  const periodEnd = unixDate(sub.current_period_end);
  const periodChanged = profile.current_period_start !== periodStart;

  const { error } = await admin.from("profiles").update({
    plan,
    stripe_customer_id: typeof sub.customer === "string" ? sub.customer : null,
    stripe_subscription_id: sub.id,
    subscription_status: sub.status,
    current_period_start: periodStart,
    current_period_end: periodEnd,
    ...(plan === "lenda" && periodChanged
      ? { lenda_consultation_used: false, lenda_consultation_used_at: null }
      : {}),
  }).eq("id", profile.id);
  if (error) throw error;

  if (sub.metadata?.plan === "lenda") {
    await admin.rpc("record_vet_subscription_history", {
      p_creator_id: profile.id,
      p_plan: "lenda",
      p_event_type: eventType,
      p_status: sub.status,
      p_subscription_id: sub.id,
      p_period_start: periodStart,
      p_period_end: periodEnd,
      p_note: entitled
        ? (periodChanged ? "Período da assinatura atualizado" : "Status da assinatura atualizado")
        : "Recursos pagos bloqueados por status de assinatura não ativo; dados preservados",
    });
    if (entitled && eventType === "customer.subscription.updated" && periodChanged) {
      await admin.rpc("create_lenda_payout", {
        p_creator_id: profile.id,
        p_subscription_id: sub.id,
        p_period_start: periodStart,
      });
    }
  }
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !secret) {
    return NextResponse.json({ error: "Webhook não configurado." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, secret);
  } catch (error: any) {
    return NextResponse.json({ error: `Assinatura inválida: ${error.message}` }, { status: 400 });
  }

  const admin = createAdminClient();
  let eventLogged = false;

  try {
    const { data: existing, error: lookupError } = await admin
      .from("subscription_events")
      .select("id")
      .eq("stripe_event_id", event.id)
      .maybeSingle();
    if (lookupError) throw lookupError;
    if (existing) return NextResponse.json({ received: true, duplicate: true });

    const { error: logError } = await admin.from("subscription_events").insert({
      stripe_event_id: event.id,
      event_type: event.type,
      payload: event,
    });
    if (logError) {
      if (logError.code === "23505") return NextResponse.json({ received: true, duplicate: true });
      throw logError;
    }
    eventLogged = true;

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        // Payment Links não recebem automaticamente metadata dinâmica por usuário.
        // O endpoint de checkout envia client_reference_id no formato "userUUID_plan".
        const clientReference = session.client_reference_id || "";
        const referenceParts = clientReference.split("_");
        const referencedUserId = referenceParts.length > 1 ? referenceParts.slice(0, -1).join("_") : clientReference;
        const referencedPlan = referenceParts.length > 1 ? referenceParts[referenceParts.length - 1] : null;
        const userId = session.metadata?.user_id || referencedUserId;
        const plan = session.metadata?.plan || referencedPlan;
        const subscriptionId = typeof session.subscription === "string" ? session.subscription : null;
        if (!userId || !plan || !["amador", "profissional", "lenda"].includes(plan)) break;

        let subscription: Stripe.Subscription | null = null;
        if (subscriptionId) {
          // Persiste user_id e plan na assinatura para que eventos futuros de renovação,
          // inadimplência e cancelamento possam ser associados ao perfil correto.
          await getStripe().subscriptions.update(subscriptionId, {
            metadata: { user_id: userId, plan },
          });
          subscription = await getStripe().subscriptions.retrieve(subscriptionId);
        }
        const entitled = subscription ? isEntitledStatus(subscription.status) : false;
        const { error } = await admin.from("profiles").update({
          plan: entitled ? plan : "free",
          stripe_customer_id: typeof session.customer === "string" ? session.customer : null,
          stripe_subscription_id: subscriptionId,
          subscription_status: subscription?.status || "incomplete",
          current_period_start: unixDate(subscription?.current_period_start),
          current_period_end: unixDate(subscription?.current_period_end),
          ...(entitled && plan === "lenda"
            ? { lenda_consultation_used: false, lenda_consultation_used_at: null }
            : {}),
        }).eq("id", userId);
        if (error) throw error;

        if (subscription && plan === "lenda" && entitled) {
          await admin.rpc("record_vet_subscription_history", {
            p_creator_id: userId,
            p_plan: "lenda",
            p_event_type: event.type,
            p_status: subscription.status,
            p_subscription_id: subscription.id,
            p_period_start: unixDate(subscription.current_period_start),
            p_period_end: unixDate(subscription.current_period_end),
            p_note: "Assinatura Lenda iniciada",
          });
          await admin.rpc("create_lenda_payout", {
            p_creator_id: userId,
            p_subscription_id: subscription.id,
            p_period_start: unixDate(subscription.current_period_start),
          });
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        await applySubscriptionState(admin, event.data.object as Stripe.Subscription, event.type);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const profile = await findProfileForSubscription(admin, subscription);
        if (!profile) break;
        if (profile.stripe_subscription_id && profile.stripe_subscription_id !== subscription.id) break;

        const { error } = await admin.from("profiles").update({
          plan: "free",
          subscription_status: "canceled",
          stripe_subscription_id: subscription.id,
          current_period_end: unixDate(subscription.current_period_end),
        }).eq("id", profile.id);
        if (error) throw error;

        if (profile.plan === "lenda" || subscription.metadata?.plan === "lenda") {
          await admin.rpc("record_vet_subscription_history", {
            p_creator_id: profile.id,
            p_plan: "lenda",
            p_event_type: event.type,
            p_status: "canceled",
            p_subscription_id: subscription.id,
            p_period_start: null,
            p_period_end: unixDate(subscription.current_period_end),
            p_note: "Assinatura cancelada; dados do criatório preservados",
          });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === "string" ? invoice.customer : null;
        const subId = invoiceSubscriptionId(invoice);
        if (customerId) {
          let query = admin.from("profiles").select("id,stripe_subscription_id,plan").eq("stripe_customer_id", customerId);
          const { data: profile } = await query.maybeSingle();
          if (profile && (subId
            ? (!profile.stripe_subscription_id || profile.stripe_subscription_id === subId)
            : !profile.stripe_subscription_id)) {
            const { error } = await admin.from("profiles").update({
              plan: "free",
              subscription_status: "past_due",
            }).eq("id", profile.id);
            if (error) throw error;
          }
        }
        break;
      }

      case "invoice.paid":
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === "string" ? invoice.customer : null;
        const subId = invoiceSubscriptionId(invoice);
        if (!customerId || !subId) break;

        const { data: profile } = await admin.from("profiles")
          .select("id,stripe_subscription_id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();
        // Evita que uma fatura atrasada de uma assinatura antiga reative um plano substituído.
        if (profile?.stripe_subscription_id && profile.stripe_subscription_id !== subId) break;

        const subscription = await getStripe().subscriptions.retrieve(subId);
        if (!isEntitledStatus(subscription.status)) break;
        await applySubscriptionState(admin, subscription, event.type);
        break;
      }

      case "charge.dispute.created": {
        const dispute = event.data.object as Stripe.Dispute;
        const chargeId = typeof dispute.charge === "string" ? dispute.charge : null;
        if (!chargeId) break;
        const charge = await getStripe().charges.retrieve(chargeId);
        const customerId = typeof charge.customer === "string" ? charge.customer : null;
        if (!customerId) break;

        const { data: profile } = await admin.from("profiles")
          .select("id,plan,stripe_subscription_id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();
        if (!profile) break;

        const { error } = await admin.from("profiles").update({
          plan: "free",
          subscription_status: "chargeback",
        }).eq("id", profile.id);
        if (error) throw error;

        if (profile.plan === "lenda") {
          await admin.from("vet_payouts").update({
            status: "cancelled",
            note: "Repasse cancelado por chargeback/disputa de pagamento.",
          }).eq("creator_id", profile.id).eq("status", "pending");
          await admin.rpc("record_vet_subscription_history", {
            p_creator_id: profile.id,
            p_plan: "lenda",
            p_event_type: event.type,
            p_status: "chargeback",
            p_subscription_id: profile.stripe_subscription_id,
            p_period_start: null,
            p_period_end: null,
            p_note: "Chargeback/disputa registrada; recursos pagos bloqueados e dados preservados.",
          });
        }
        break;
      }
    }
  } catch (error) {
    console.error("Stripe webhook DB error", error);
    // Se o processamento falhou, removemos somente o marcador do evento para permitir retry do Stripe.
    // Nenhum dado do usuário é apagado.
    if (eventLogged) {
      await admin.from("subscription_events").delete().eq("stripe_event_id", event.id);
    }
    return NextResponse.json({ error: "Erro interno do webhook." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
