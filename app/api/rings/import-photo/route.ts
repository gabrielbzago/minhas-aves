import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { effectivePlan } from "@/lib/plans";

export const runtime = "nodejs";
export const maxDuration = 45;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const MONTHLY_LIMITS: Record<string, number> = { profissional: 30, lenda: 100 };

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireUser();
    const { data: profile } = await supabase.from("profiles").select("plan,role").eq("id", user.id).maybeSingle();
    const plan = effectivePlan(profile?.plan, profile?.role);
    const privileged = profile?.role === "owner" || profile?.role === "veterinarian";
    if (!privileged && !["profissional", "lenda"].includes(plan)) {
      return NextResponse.json({ error: "A importação de anilhas por foto em lote está disponível nos planos Profissional e Lenda." }, { status: 403 });
    }
    const body = await request.json();
    if (body?.action === "import") {
      const numbers = Array.isArray(body.ringNumbers) ? body.ringNumbers : [];
      const speciesId = String(body.speciesId || "");
      if (!speciesId || !numbers.length || numbers.length > 300) return NextResponse.json({ error: "Informe a espécie e uma lista válida de até 300 anilhas." }, { status: 400 });
      const clean = [...new Set(numbers.map((n: any) => String(n || "").trim()).filter(Boolean))];
      if (!clean.length) return NextResponse.json({ error: "Nenhum número válido foi informado." }, { status: 400 });
      if (clean.length !== numbers.length) return NextResponse.json({ error: "A lista contém números vazios ou repetidos. Revise antes de importar." }, { status: 400 });
      const { data: existing, error: existingError } = await supabase.from("ring_inventory").select("ring_number").eq("user_id", user.id).in("ring_number", clean);
      if (existingError) return NextResponse.json({ error: "Não foi possível conferir duplicidades no estoque." }, { status: 500 });
      const duplicates = new Set((existing || []).map((r: any) => String(r.ring_number).toLowerCase()));
      const duplicated = clean.filter((n: string) => duplicates.has(n.toLowerCase()));
      if (duplicated.length) return NextResponse.json({ error: `Já existem anilhas com estes números: ${duplicated.slice(0, 12).join(", ")}${duplicated.length > 12 ? "…" : ""}. Remova-as da lista para continuar.`, duplicates: duplicated }, { status: 409 });
      const { data: species } = await supabase.from("species").select("id").eq("id", speciesId).eq("is_active", true).maybeSingle();
      if (!species) return NextResponse.json({ error: "A espécie selecionada não está disponível no catálogo." }, { status: 400 });
      const fatherId = body.fatherId || null, motherId = body.motherId || null;
      const rows = clean.map((ring_number: string) => ({ user_id: user.id, ring_number, species_id: speciesId, father_id: fatherId, mother_id: motherId, notes: String(body.notes || "Importado por foto em lote").slice(0, 1000), sex: "indeterminado", status: "disponivel" }));
      const { data, error } = await supabase.from("ring_inventory").insert(rows).select("id,ring_number");
      if (error) return NextResponse.json({ error: error.message?.includes("duplicate") ? "Um ou mais números já estão cadastrados." : "Não foi possível gravar o lote. Confira espécie e vínculos de pai/mãe." }, { status: 400 });
      return NextResponse.json({ success: true, imported: data?.length || clean.length, data: data || [] });
    }
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "A leitura por IA ainda não está configurada." }, { status: 503 });
    const image = String(body?.image || "");
    const mime = String(body?.mimeType || "").toLowerCase();
    const match = image.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
    if (!match || match[1] !== mime) return NextResponse.json({ error: "Imagem inválida. Envie JPG, PNG ou WEBP." }, { status: 400 });
    const bytes = Buffer.from(match[2], "base64");
    if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) return NextResponse.json({ error: "A foto otimizada deve ter no máximo 4 MB." }, { status: 413 });
    const month = new Date().toISOString().slice(0, 7);
    const { count, error: countError } = await supabase.from("ai_bird_scan_usage").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("usage_month", month);
    if (countError) return NextResponse.json({ error: "Não foi possível validar o limite mensal de IA." }, { status: 500 });
    const limit = MONTHLY_LIMITS[plan] || 1000;
    if (!privileged && (count || 0) >= limit) return NextResponse.json({ error: `Você atingiu o limite mensal de ${limit} leituras por IA do seu plano.` }, { status: 429 });
    const prompt = `Leia esta foto de uma lista/planilha de estoque de anilhas de aves. Extraia TODOS os números/códigos de anilha individuais, na ordem em que aparecem, sem inventar caracteres. Ignore quantidades, datas, preços, medidas, telefones e códigos que claramente não sejam números de anilha. Cada linha deve gerar apenas um código completo. Preserve letras, números, pontos, barras e hífens. Se um caractere estiver ilegível, NÃO adivinhe: omita aquele item e informe-o em uncertain. Remova duplicatas idênticas. Responda somente JSON: {"ring_numbers":["..."],"uncertain":["descrição curta da linha ilegível"],"notes":"observação geral"}. Não invente números. Se a imagem tiver várias colunas, leia todas de cima para baixo e da esquerda para a direita.`;
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_BIRD_VISION_MODEL || "gpt-4.1-mini",
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "Você é especialista em OCR de listas de estoque de anilhas para aves. Seja conservador: nunca complete números ilegíveis nem transforme quantidades em códigos.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mime};base64,${bytes.toString("base64")}`,
                  detail: "high",
                },
              },
            ],
          },
        ],
      }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) return NextResponse.json({ error: "A leitura da foto falhou. Tente uma imagem mais nítida, reta e bem iluminada." }, { status: 502 });
    let parsed: any; try { parsed = JSON.parse(result?.choices?.[0]?.message?.content || "{}"); } catch { return NextResponse.json({ error: "A IA não conseguiu estruturar a lista. Tente novamente." }, { status: 502 }); }
    const ringNumbers = Array.isArray(parsed.ring_numbers) ? [...new Set(parsed.ring_numbers.map((n: any) => String(n || "").trim()).filter((n: string) => n && n.length <= 120))].slice(0, 300) : [];
    if (!ringNumbers.length) return NextResponse.json({ error: "Não encontrei números de anilha legíveis nesta foto. Tente aproximar e fotografar a lista inteira." }, { status: 422 });
    const { error: usageError } = await supabase.from("ai_bird_scan_usage").insert({ user_id: user.id, usage_month: month });
    if (usageError) console.error("[Apollo AI] ring batch usage", usageError);
    return NextResponse.json({ ringNumbers, uncertain: Array.isArray(parsed.uncertain) ? parsed.uncertain.slice(0, 30) : [], notes: typeof parsed.notes === "string" ? parsed.notes : "", usage: { used: (count || 0) + 1, limit } });
  } catch (error: any) {
    if (error?.message === "UNAUTHENTICATED") return NextResponse.json({ error: "Faça login novamente." }, { status: 401 });
    console.error("[Apollo AI] ring batch import", error);
    return NextResponse.json({ error: "Não foi possível processar a importação." }, { status: 500 });
  }
}
