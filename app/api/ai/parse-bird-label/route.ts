import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { effectivePlan } from "@/lib/plans";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const MONTHLY_LIMITS: Record<string, number> = { profissional: 30, lenda: 100 };

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireUser();
    const { data: profile } = await supabase.from("profiles").select("plan,role").eq("id", user.id).maybeSingle();
    const plan = effectivePlan(profile?.plan, profile?.role);
    if (!["profissional", "lenda"].includes(plan) && profile?.role !== "owner" && profile?.role !== "veterinarian") {
      return NextResponse.json({ error: "O Cadastro Inteligente por Foto está disponível nos planos Profissional e Lenda." }, { status: 403 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "O recurso ainda não está configurado. O administrador precisa cadastrar OPENAI_API_KEY nas variáveis de ambiente da Vercel." }, { status: 503 });

    const body = await request.json();
    const image = String(body?.image || "");
    const mime = String(body?.mimeType || "").toLowerCase();
    if (!["image/jpeg", "image/png", "image/webp"].includes(mime)) return NextResponse.json({ error: "Envie uma imagem JPG, PNG ou WEBP." }, { status: 400 });
    const match = image.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
    if (!match || match[1] !== mime) return NextResponse.json({ error: "Imagem inválida. Selecione novamente o arquivo." }, { status: 400 });
    const bytes = Buffer.from(match[2], "base64");
    if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) return NextResponse.json({ error: "A imagem otimizada deve ter no máximo 3 MB." }, { status: 413 });

    const month = new Date().toISOString().slice(0, 7);
    const { count, error: countError } = await supabase.from("ai_bird_scan_usage").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("usage_month", month);
    if (countError) {
      console.error("[Apollo AI] usage count", countError);
      return NextResponse.json({ error: "Não foi possível validar o limite mensal do recurso. Verifique a migration do Supabase." }, { status: 500 });
    }
    const limit = MONTHLY_LIMITS[plan] || 1000;
    if (profile?.role !== "owner" && profile?.role !== "veterinarian" && (count || 0) >= limit) {
      return NextResponse.json({ error: `Você atingiu o limite de ${limit} leituras por foto neste mês do plano ${plan === "lenda" ? "Lenda" : "Profissional"}.` }, { status: 429 });
    }

    const { data: speciesRows } = await supabase.from("species").select("id,common_name,scientific_name").eq("is_active", true).order("common_name");
    const speciesCatalog = (speciesRows || []).map((s: any) => ({ id: s.id, nome_popular: s.common_name, nome_cientifico: s.scientific_name }));
    const prompt = `Você é um extrator de dados de plaquinhas de identificação de aves de criatórios brasileiros. Leia a imagem e retorne SOMENTE JSON válido. Não invente dados. Se um campo estiver ausente ou ilegível, use null. Datas em YYYY-MM-DD somente se dia, mês e ano forem inequívocos; caso contrário null. Sexo deve ser "macho", "femea" ou "indeterminado". Não confunda número de anilha com registro regulatório. Se a plaquinha contiver nome popular/científico, identifique ambos. Escolha species_id apenas por correspondência inequívoca com o catálogo fornecido; se houver dúvida, null. O nome da ave é o nome individual, não o nome da espécie. Campos: name, species_id, sex, birth_date, ring_number, ibama_registration_number, ibama_record_type, genetic_line, mutation_type, notes, genetics. mutation_type deve ser uma destas opções quando legível: Lutino, Branco, Preto, Canela, Diluido, Laranjeira, Ardesiaca; caso contrário null. genetics deve ser objeto JSON. Catálogo de espécies: ${JSON.stringify(speciesCatalog)}.`;
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_BIRD_VISION_MODEL || "gpt-4.1-mini",
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "Extraia somente informações realmente visíveis. Nunca deduza ou complete dados ausentes." },
          { role: "user", content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: `data:${mime};base64,${bytes.toString("base64")}`, detail: "high" } }
          ]}
        ]
      })
    });
    const result = await openaiResponse.json().catch(() => ({}));
    if (!openaiResponse.ok) {
      console.error("[Apollo AI] OpenAI error", result?.error?.message || openaiResponse.status);
      return NextResponse.json({ error: "A leitura da imagem não foi concluída. Tente uma foto mais nítida e bem iluminada." }, { status: 502 });
    }
    const content = result?.choices?.[0]?.message?.content;
    if (!content) return NextResponse.json({ error: "A IA não conseguiu identificar dados nessa imagem." }, { status: 422 });
    let parsed: any;
    try { parsed = JSON.parse(content); } catch { return NextResponse.json({ error: "Não foi possível interpretar o resultado. Tente novamente." }, { status: 502 }); }

    const allowedMutations = ["Lutino", "Branco", "Preto", "Canela", "Diluido", "Laranjeira", "Ardesiaca"];
    const species = speciesCatalog.find((s: any) => s.id === parsed.species_id);
    const payload = {
      name: typeof parsed.name === "string" ? parsed.name.trim().slice(0, 100) : "",
      species_id: species?.id || null,
      sex: ["macho", "femea", "indeterminado"].includes(parsed.sex) ? parsed.sex : "indeterminado",
      birth_date: typeof parsed.birth_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(parsed.birth_date) ? parsed.birth_date : "",
      ring_number: typeof parsed.ring_number === "string" ? parsed.ring_number.trim().slice(0, 120) : "",
      ibama_registration_number: typeof parsed.ibama_registration_number === "string" ? parsed.ibama_registration_number.trim().slice(0, 120) : "",
      ibama_record_type: typeof parsed.ibama_record_type === "string" ? parsed.ibama_record_type.trim().slice(0, 120) : "",
      genetic_line: typeof parsed.genetic_line === "string" ? parsed.genetic_line.trim().slice(0, 160) : "",
      mutation_type: allowedMutations.includes(parsed.mutation_type) ? parsed.mutation_type : "",
      notes: typeof parsed.notes === "string" ? parsed.notes.trim().slice(0, 2000) : "",
      genetics: parsed.genetics && typeof parsed.genetics === "object" && !Array.isArray(parsed.genetics) ? parsed.genetics : {},
      extracted_species_name: typeof parsed.common_name === "string" ? parsed.common_name : "",
      extracted_scientific_name: typeof parsed.scientific_name === "string" ? parsed.scientific_name : ""
    };

    const { error: usageError } = await supabase.from("ai_bird_scan_usage").insert({ user_id: user.id, usage_month: month });
    if (usageError) console.error("[Apollo AI] usage insert", usageError);
    return NextResponse.json({ data: payload, usage: { used: (count || 0) + 1, limit } });
  } catch (error) {
    console.error("[Apollo AI] parse label", error);
    return NextResponse.json({ error: "Não foi possível processar a foto. Tente novamente." }, { status: 500 });
  }
}
