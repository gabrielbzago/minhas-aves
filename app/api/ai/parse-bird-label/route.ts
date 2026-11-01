import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { effectivePlan } from "@/lib/plans";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const MONTHLY_LIMITS: Record<string, number> = { free: 1, profissional: 30, lenda: 100 };

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireUser();
    const { data: profile } = await supabase.from("profiles").select("plan,role").eq("id", user.id).maybeSingle();
    const plan = effectivePlan(profile?.plan, profile?.role);
    const isPrivileged = profile?.role === "owner" || profile?.role === "veterinarian";
    if (!MONTHLY_LIMITS[plan] && !isPrivileged) {
      return NextResponse.json({ error: "O Cadastro Inteligente por Foto está disponível com uma experiência gratuita e limites ampliados nos planos pagos." }, { status: 403 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "O recurso ainda não está configurado. O administrador precisa cadastrar OPENAI_API_KEY nas variáveis de ambiente da Vercel." }, { status: 503 });

    const body = await request.json();
    const mode = body?.mode === "genealogy" ? "genealogy" : "bird";
    const rawImages = Array.isArray(body?.images) ? body.images : [{ image: body?.image, mimeType: body?.mimeType }];
    if (plan === "free" && !isPrivileged && mode === "genealogy") return NextResponse.json({ error: "A genealogia por foto é um recurso dos planos Profissional e Lenda. Faça upgrade para desbloquear essa ferramenta." }, { status: 403 });
    if (plan === "free" && !isPrivileged && rawImages.length > 1) return NextResponse.json({ error: "No plano Grátis, você pode experimentar uma foto da frente por mês. O envio da frente e do verso está disponível nos planos pagos." }, { status: 403 });
    if (!rawImages.length || rawImages.length > 2) return NextResponse.json({ error: "Envie uma ou duas fotos da plaquinha." }, { status: 400 });
    const imagePayloads = rawImages.map((item: any) => {
      const image = String(item?.image || "");
      const mime = String(item?.mimeType || "").toLowerCase();
      if (!["image/jpeg", "image/png", "image/webp"].includes(mime)) throw new Error("Envie imagens JPG, PNG ou WEBP.");
      const match = image.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
      if (!match || match[1] !== mime) throw new Error("Imagem inválida. Selecione novamente o arquivo.");
      const bytes = Buffer.from(match[2], "base64");
      if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) throw new Error("Cada imagem otimizada deve ter no máximo 3 MB.");
      return { mime, base64: bytes.toString("base64") };
    });
    if (imagePayloads.reduce((sum: number, item: any) => sum + Buffer.byteLength(item.base64, "base64"), 0) > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "O conjunto das fotos ultrapassa o limite de 5 MB." }, { status: 413 });
    }

    const month = new Date().toISOString().slice(0, 7);
    const { count, error: countError } = await supabase.from("ai_bird_scan_usage").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("usage_month", month);
    if (countError) {
      console.error("[Apollo AI] usage count", countError);
      return NextResponse.json({ error: "Não foi possível validar o limite mensal do recurso. Verifique a migration do Supabase." }, { status: 500 });
    }
    const limit = MONTHLY_LIMITS[plan] || 1000;
    if (!isPrivileged && (count || 0) >= limit) {
      const message = plan === "free"
        ? "Você já utilizou sua análise gratuita deste mês. Faça upgrade para o Profissional e tenha até 30 análises mensais, foto da frente e do verso e genealogia por foto."
        : `Você atingiu o limite de ${limit} leituras por foto neste mês do plano ${plan === "lenda" ? "Lenda" : "Profissional"}.`;
      return NextResponse.json({ error: message, upgrade: plan === "free", usage: { used: count || 0, limit } }, { status: 429 });
    }
    let prompt = "";
    let speciesCatalog: any[] = [];
    if (mode === "genealogy") {
      const { data: birdRows, error: birdsError } = await supabase
        .from("birds")
        .select("id,name,sex,ring_number,species_id,status,is_genealogy_reference")
        .eq("status", "ativo")
        .eq("is_genealogy_reference", false)
        .order("name");
      if (birdsError) {
        console.error("[Apollo AI] genealogy birds", birdsError);
        return NextResponse.json({ error: "Não foi possível consultar o plantel para cruzar a genealogia." }, { status: 500 });
      }
      const catalog = (birdRows || []).map((b: any) => ({
        id: b.id, nome: b.name, sexo: b.sex, anilha: b.ring_number || null, especie_id: b.species_id
      }));
      prompt = `Você é especialista em ler árvores genealógicas e placas de aves de criatórios brasileiros. Analise a imagem e retorne SOMENTE JSON válido. Extraia os dados dos PAIS da ave principal (pai e mãe), mesmo quando não houver rótulos perfeitos. Não confunda avós com pais: use apenas os indivíduos indicados como pai/mãe da ave identificada. Se a imagem mostrar uma árvore genealógica, localize a ave principal na coluna AVE e os dois indivíduos diretamente ligados na coluna PAIS. Não retorne avós, bisavós ou trisavós como pai/mãe.

Para cada pai/mãe, extraia o nome e a anilha exatamente como aparecem. Os campos podem estar sem rótulos; use posição e contexto. Se não houver informação legível, use null. Não invente nomes, números ou parentesco. O catálogo abaixo contém somente aves já cadastradas neste criatório; compare com os nomes/anilhas visíveis apenas como referência, mas NÃO escolha um ID por aproximação. O servidor fará o vínculo exato. Catálogo do plantel: ${JSON.stringify(catalog)}.

Retorne as chaves: bird_name, father_name, father_ring_number, mother_name, mother_ring_number, notes. Use null para campos ausentes.`;
    } else {
      const { data: speciesRows } = await supabase.from("species").select("id,common_name,scientific_name").eq("is_active", true).order("common_name");
      speciesCatalog = (speciesRows || []).map((s: any) => ({ id: s.id, nome_popular: s.common_name, nome_cientifico: s.scientific_name }));
      prompt = `Você é um especialista em leitura de plaquinhas e fichas de identificação de aves de criatórios brasileiros. Sua tarefa é EXTRAIR E CLASSIFICAR os dados, não apenas copiar rótulos impressos. Leia cuidadosamente todas as imagens enviadas (frente e verso podem conter informações complementares). Combine as informações das duas faces em um único cadastro, resolva divergências priorizando o texto mais legível e não descarte dados presentes somente no verso. Observe a posição dos textos, padrões de códigos e contexto típico de anilhas de aves. Retorne SOMENTE um objeto JSON válido.

REGRA GERAL: não exija que o campo esteja explicitamente nomeado. Em placas antigas e modernas, os dados podem aparecer sem rótulos como "anilha", "nascimento" ou "IBAMA". Use o padrão visual e o contexto para classificar. Não invente caracteres: quando não conseguir distinguir um caractere, deixe o campo correspondente null em vez de adivinhar.

CLASSIFICAÇÃO DA ANILHA (MUITO IMPORTANTE):
- O código da anilha pode aparecer sozinho, sem a palavra "anilha". Procure sequências alfanuméricas que tenham formato típico de identificação de anilha.
- Em criatórios brasileiros, uma anilha pode conter marca ou sigla como IBAMA/SISPASS, medida/diâmetro do aro (por exemplo 2.2), UF ou código de região (por exemplo MG/A), um trecho de data (por exemplo 05 06 ou 0506) e um número sequencial final, frequentemente com cerca de seis dígitos (por exemplo 093272).
- Exemplos ilustrativos de código completo de anilha: "IBAMA 2.2 MG/A 0506 093272", "SISPASS 2.2 MG/A 093272", "2.2 MG/A 093272". Esses exemplos explicam padrões; NÃO os copie se não estiverem na imagem.
- Se encontrar uma sequência compatível com esse padrão, preencha ring_number com o código COMPLETO, preservando letras, números, barras, pontos e a ordem original. Não descarte o prefixo IBAMA/SISPASS, a medida ou o sufixo numérico.
- Não confunda o código físico da anilha com um número de registro/cadastro do criador. O número de anilha identifica o pássaro e normalmente tem estrutura compacta com códigos e número sequencial.
- Preencha ibama_registration_number somente quando houver outro número claramente identificável como registro oficial do criador/IBAMA, distinto da anilha. Se houver apenas um código e ele tiver formato típico de anilha, priorize ring_number e deixe ibama_registration_number null.
- Se houver dois códigos, classifique cada um separadamente. Nunca duplique o mesmo código nos dois campos.
- Se houver um código alfanumérico sem rótulo e não for possível decidir com segurança, coloque-o em ring_number apenas se o padrão de anilha for forte; caso contrário, deixe os campos de identificação vazios e registre a dúvida em notes.

NOME E ESPÉCIE:
- O nome da ave é o nome individual/apelido, por exemplo "Thunderbolt"; não substitua pelo nome da espécie.
- Identifique nome popular e nome científico quando visíveis ou claramente reconhecíveis pelo texto.
- Escolha species_id apenas se uma espécie do catálogo corresponder com segurança ao nome popular ou científico encontrado. Se houver dúvida, null. Não invente espécie por aparência da ave em uma plaquinha textual.
- Catálogo ativo do criatório: ${JSON.stringify(speciesCatalog)}.

OUTROS CAMPOS:
- Datas de nascimento podem estar sem rótulo. Identifique datas em formatos brasileiros DD/MM/AAAA, DD-MM-AAAA ou DD.MM.AAAA. Converta para YYYY-MM-DD somente quando dia, mês e ano forem inequívocos. Um trecho curto como 05/06 sem ano não é uma data de nascimento completa: não invente o ano.
- Sexo: "macho", "femea" ou "indeterminado". Considere M/Macho e F/Fêmea.
- mutation_type deve ser exatamente uma destas opções quando legível: Lutino, Branco, Preto, Canela, Diluido, Laranjeira, Ardesiaca; caso contrário null.
- Preserve observações úteis em notes. genetics deve ser objeto JSON.
- Retorne estas chaves: name, common_name, scientific_name, species_id, sex, birth_date, ring_number, ibama_registration_number, ibama_record_type, genetic_line, mutation_type, notes, genetics.
- Para campos ausentes/ilegíveis use null. Não complete informações por suposição. A classificação contextual dos códigos é permitida, mas a invenção de caracteres não.

Examine cuidadosamente números pequenos e sequências alfanuméricas, principalmente linhas sem rótulos entre o nome da ave e a data de nascimento.`;
    }
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_BIRD_VISION_MODEL || "gpt-4.1-mini",
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: mode === "genealogy"
            ? "Você é especialista em leitura de árvores genealógicas de aves. Diferencie pais diretos de avós e ancestrais mais distantes. Não invente parentescos."
            : "Você é especialista em plaquinhas de criatórios brasileiros. Extraia os caracteres visíveis com máxima atenção e classifique códigos pelo padrão e contexto mesmo sem rótulo. Não invente caracteres nem complete datas ou números ausentes. Diferencie rigorosamente código de anilha de registro regulatório." },
          { role: "user", content: [
            { type: "text", text: prompt },
            ...imagePayloads.map((item: any, index: number) => ({
              type: "image_url",
              image_url: { url: `data:${item.mime};base64,${item.base64}`, detail: "high" },
            }))
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

    if (mode === "genealogy") {
      const { data: plantel, error: plantelError } = await supabase
        .from("birds")
        .select("id,name,sex,ring_number,species_id,status,is_genealogy_reference")
        .eq("status", "ativo")
        .eq("is_genealogy_reference", false);
      if (plantelError) return NextResponse.json({ error: "Não foi possível cruzar os nomes e anilhas com o plantel." }, { status: 500 });
      const normalize = (value: any) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
      const resolveParent = (name: any, ring: any, requiredSex: "macho" | "femea") => {
        const n = normalize(name); const r = normalize(ring);
        if (!n && !r) return { id: null, status: "ausente", name: name || null, ring_number: ring || null };
        const matches = (plantel || []).filter((bird: any) => {
          if (bird.sex !== requiredSex) return false;
          // Anilha é identificador mais forte: se a foto trouxe anilha, não fazemos fallback por nome.
          if (r) return normalize(bird.ring_number) === r;
          return !!n && normalize(bird.name) === n;
        });
        if (matches.length === 1) return { id: matches[0].id, status: "vinculado", name: matches[0].name, ring_number: matches[0].ring_number || null };
        if (matches.length > 1) return { id: null, status: "ambiguo", name: name || null, ring_number: ring || null };
        return { id: null, status: "nao_cadastrado", name: name || null, ring_number: ring || null };
      };
      const father = resolveParent(parsed.father_name, parsed.father_ring_number, "macho");
      const mother = resolveParent(parsed.mother_name, parsed.mother_ring_number, "femea");
      const { error: usageError } = await supabase.from("ai_bird_scan_usage").insert({ user_id: user.id, usage_month: month });
      if (usageError) console.error("[Apollo AI] usage insert", usageError);
      return NextResponse.json({
        data: {
          bird_name: typeof parsed.bird_name === "string" ? parsed.bird_name.trim() : "",
          father_id: father.id,
          mother_id: mother.id,
          father,
          mother,
          notes: typeof parsed.notes === "string" ? parsed.notes : ""
        },
        usage: { used: (count || 0) + 1, limit }
      });
    }

    const allowedMutations = ["Lutino", "Branco", "Preto", "Canela", "Diluido", "Laranjeira", "Ardesiaca"];
    const species = speciesCatalog.find((s: any) => s.id === parsed.species_id);
    const normalizedRing = typeof parsed.ring_number === "string" ? parsed.ring_number.trim() : "";
    const normalizedIbama = typeof parsed.ibama_registration_number === "string" ? parsed.ibama_registration_number.trim() : "";
    const ringPattern = /(?:\bIBAMA\b|\bSISPASS\b|\b\d[.,]\d\b|\b[A-Z]{2}\s*\/\s*[A-Z]\b)/i;
    const ibamaLooksLikeRing = !normalizedRing && normalizedIbama && ringPattern.test(normalizedIbama) && (normalizedIbama.match(/\d/g) || []).length >= 5;
    const finalRingNumber = normalizedRing || (ibamaLooksLikeRing ? normalizedIbama : "");
    const finalIbamaRegistration = ibamaLooksLikeRing ? "" : normalizedIbama;
    const payload = {
      name: typeof parsed.name === "string" ? parsed.name.trim().slice(0, 100) : "",
      species_id: species?.id || null,
      sex: ["macho", "femea", "indeterminado"].includes(parsed.sex) ? parsed.sex : "indeterminado",
      birth_date: typeof parsed.birth_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(parsed.birth_date) ? parsed.birth_date : "",
      ring_number: finalRingNumber.slice(0, 120),
      ibama_registration_number: finalIbamaRegistration.slice(0, 120),
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
