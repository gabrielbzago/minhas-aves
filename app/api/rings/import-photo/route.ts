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
      const items: Array<{ ring_number: string; mother_ring_number?: string }> = Array.isArray(body.items)
        ? body.items.map((item: any) => ({ ring_number: String(item?.ring_number || "").trim(), mother_ring_number: String(item?.mother_ring_number || "").trim() }))
        : (Array.isArray(body.ringNumbers) ? body.ringNumbers.map((n: unknown) => ({ ring_number: String(n ?? "").trim(), mother_ring_number: "" })) : []);
      const speciesId = String(body.speciesId || "");
      if (!speciesId || !items.length || items.length > 300) return NextResponse.json({ error: "Informe a espécie e uma lista válida de até 300 anilhas." }, { status: 400 });
      if (items.some((item) => !item.ring_number || item.ring_number.length > 120)) return NextResponse.json({ error: "Há números vazios ou inválidos. Revise a lista antes de importar." }, { status: 400 });
      const clean = items.map((item) => item.ring_number);
      const unique = new Set(clean.map((n) => n.toLowerCase()));
      if (unique.size !== clean.length) return NextResponse.json({ error: "A lista contém números repetidos. Revise antes de importar." }, { status: 400 });
      const { data: existing, error: existingError } = await supabase.from("ring_inventory").select("ring_number").eq("user_id", user.id).in("ring_number", clean);
      if (existingError) return NextResponse.json({ error: "Não foi possível conferir duplicidades no estoque." }, { status: 500 });
      const duplicates = new Set((existing || []).map((r: any) => String(r.ring_number).toLowerCase()));
      const duplicated = clean.filter((n) => duplicates.has(n.toLowerCase()));
      if (duplicated.length) return NextResponse.json({ error: `Já existem anilhas com estes números: ${duplicated.slice(0, 12).join(", ")}${duplicated.length > 12 ? "…" : ""}. Remova-as da lista para continuar.`, duplicates: duplicated }, { status: 409 });
      const { data: species } = await supabase.from("species").select("id").eq("id", speciesId).eq("is_active", true).maybeSingle();
      if (!species) return NextResponse.json({ error: "A espécie selecionada não está disponível no catálogo." }, { status: 400 });
      const motherNumbers: string[] = [...new Set(items.map((item) => item.mother_ring_number).filter((number): number is string => typeof number === "string" && number.trim().length > 0))];
      const motherByRing = new Map<string, any>();
      if (motherNumbers.length) {
        const { data: mothers, error: motherError } = await supabase.from("birds").select("id,ring_number,name,sex,species_id").eq("user_id", user.id).in("ring_number", motherNumbers);
        if (motherError) return NextResponse.json({ error: "Não foi possível localizar as matrizes pelo número de anilha." }, { status: 500 });
        (mothers || []).forEach((bird: any) => motherByRing.set(String(bird.ring_number).trim().toLowerCase(), bird));
        const unresolved = motherNumbers.filter((number) => !motherByRing.has(number.toLowerCase()));
        if (unresolved.length) return NextResponse.json({ error: `Não encontrei estas anilhas de mãe no plantel: ${unresolved.join(", ")}. Confira os números ou cadastre as matrizes antes de importar.` , unresolvedMothers: unresolved }, { status: 422 });
        const invalid = motherNumbers.filter((number) => { const bird = motherByRing.get(number.toLowerCase()); return bird.sex !== "femea" || (bird.species_id && bird.species_id !== speciesId); });
        if (invalid.length) return NextResponse.json({ error: `Estas matrizes não estão cadastradas como fêmeas da espécie selecionada: ${invalid.join(", ")}.` }, { status: 422 });
      }
      const defaultMotherId = body.motherId || null;
      const fatherId = body.fatherId || null;
      const rows = items.map((item) => ({ user_id: user.id, ring_number: item.ring_number, species_id: speciesId, father_id: fatherId, mother_id: item.mother_ring_number ? motherByRing.get(item.mother_ring_number.toLowerCase())?.id : defaultMotherId, notes: String(body.notes || "Importado por foto em lote").slice(0, 1000), sex: "indeterminado", status: "disponivel" }));
      const { data, error } = await supabase.from("ring_inventory").insert(rows).select("id,ring_number,mother_id");
      if (error) { console.error("[Apollo] ring batch database insert", error); return NextResponse.json({ error: error.message?.includes("duplicate") ? "Um ou mais números já estão cadastrados." : `Falha ao gravar no banco: ${error.message || "erro não identificado"}` }, { status: 400 }); }
      if (!data || data.length !== clean.length) return NextResponse.json({ error: `Gravação incompleta: foram confirmadas ${data?.length || 0} de ${clean.length} anilhas.` }, { status: 500 });
      return NextResponse.json({ success: true, imported: data.length, data: data || [] });
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
    const prompt = `Leia esta foto de uma lista/planilha de estoque de anilhas de aves. Extraia TODOS os números/códigos de anilha individuais, na ordem em que aparecem, sem inventar caracteres. Ignore quantidades, datas, preços, medidas, telefones e códigos que claramente não sejam números de anilha. Cada linha deve gerar apenas um código completo. Preserve letras, números, pontos, barras e hífens. Se um caractere estiver ilegível, NÃO adivinhe: omita aquele item e informe-o em uncertain. Remova duplicatas idênticas. Responda somente JSON: {"items":[{"ring_number":"número da anilha do estoque","mother_ring_number":"número da anilha da mãe/matriz na mesma linha, ou string vazia"}],"uncertain":["descrição curta da linha ilegível"],"notes":"observação geral"}. Identifique a coluna de mãe/matriz quando existir e associe o número à anilha da mesma linha. Se não houver coluna de mãe, use string vazia. Não invente números. Se a imagem tiver várias colunas, leia todas de cima para baixo e da esquerda para a direita.`;
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
    const rawItems: any[] = Array.isArray(parsed.items) ? parsed.items : (Array.isArray(parsed.ring_numbers) ? parsed.ring_numbers.map((n: any) => ({ ring_number: n, mother_ring_number: "" })) : []);
    const items: Array<{ ring_number: string; mother_ring_number: string }> = rawItems.map((item: any) => ({ ring_number: String(item?.ring_number || "").trim(), mother_ring_number: String(item?.mother_ring_number || "").trim() })).filter((item) => item.ring_number && item.ring_number.length <= 120).slice(0, 300);
    const seen = new Set<string>();
    const ringItems = items.filter((item) => { const key = item.ring_number.toLowerCase(); if (seen.has(key)) return false; seen.add(key); return true; });
    if (!ringItems.length) return NextResponse.json({ error: "Não encontrei números de anilha legíveis nesta foto. Tente aproximar e fotografar a lista inteira." }, { status: 422 });
    const { error: usageError } = await supabase.from("ai_bird_scan_usage").insert({ user_id: user.id, usage_month: month });
    if (usageError) console.error("[Apollo AI] ring batch usage", usageError);
    return NextResponse.json({ items: ringItems, ringNumbers: ringItems.map((item) => item.ring_number), uncertain: Array.isArray(parsed.uncertain) ? parsed.uncertain.slice(0, 30) : [], notes: typeof parsed.notes === "string" ? parsed.notes : "", usage: { used: (count || 0) + 1, limit } });
  } catch (error: any) {
    if (error?.message === "UNAUTHENTICATED") return NextResponse.json({ error: "Faça login novamente." }, { status: 401 });
    console.error("[Apollo AI] ring batch import", error);
    return NextResponse.json({ error: "Não foi possível processar a importação." }, { status: 500 });
  }
}
