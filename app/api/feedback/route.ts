import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const CATEGORIES = ["Avaliação do produto", "Sugestão de melhoria", "Problema ou erro", "Nova funcionalidade", "Experiência de uso"];
const PRIORITY: Record<string,string> = { free:"normal", amador:"prioritaria", profissional:"prioritaria", lenda:"vip" };

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Entre na sua conta para enviar sua avaliação." }, { status: 401 });
    const body = await request.json();
    const category = String(body.category || "");
    const message = String(body.message || "").trim();
    const rating = Number(body.rating);
    if (!CATEGORIES.includes(category) || !Number.isInteger(rating) || rating < 1 || rating > 5 || message.length < 8 || message.length > 3000) {
      return NextResponse.json({ error: "Confira a categoria, a nota e a mensagem (de 8 a 3.000 caracteres)." }, { status: 400 });
    }
    const { data: profile } = await supabase.from("profiles").select("plan,criatorio_name").eq("id", user.id).maybeSingle();
    const plan = ["amador", "profissional", "lenda"].includes(profile?.plan) ? profile!.plan : "free";
    const { error } = await supabase.from("product_feedback").insert({
      user_id: user.id, user_email: user.email || null, criatorio_name: profile?.criatorio_name || null,
      plan, priority: PRIORITY[plan], category, rating, message,
    });
    if (error) {
      console.error("Apollo feedback insert error:", error.message);
      return NextResponse.json({ error: "Não foi possível registrar agora. Tente pelo WhatsApp ou e-mail." }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Não foi possível processar sua avaliação." }, { status: 500 });
  }
}
