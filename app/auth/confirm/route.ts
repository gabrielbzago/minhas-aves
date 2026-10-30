import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

function safeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  return value;
}

/**
 * Garante que todo usuário autenticado tenha um registro em public.profiles.
 * O trigger do Supabase continua sendo a primeira linha de defesa; esta
 * verificação cobre usuários OAuth antigos e instalações onde o trigger
 * não criou o perfil. ignoreDuplicates preserva plano e dados existentes.
 */
async function ensureUserProfile(supabase: any) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error(userError?.message || "Sessão autenticada não encontrada após OAuth.");
  }

  const metadata = user.user_metadata || {};
  const fullName =
    metadata.full_name ||
    metadata.name ||
    metadata.fullName ||
    (typeof user.email === "string" ? user.email.split("@")[0] : "");

  const { error: profileError } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        full_name: fullName,
        criatorio_name: metadata.criatorio_name || metadata.criatorioName || null,
      },
      { onConflict: "id", ignoreDuplicates: true }
    );

  if (profileError) {
    console.error("[Apollo] não foi possível garantir o perfil após OAuth:", {
      userId: user.id,
      message: profileError.message,
      code: profileError.code,
    });
    throw new Error("Não foi possível preparar seu perfil. Tente entrar novamente ou contate o suporte.");
  }

  return user;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;
  const nextPath = safeNextPath(requestUrl.searchParams.get("next"));
  const successResponse = NextResponse.redirect(new URL(nextPath, origin));
  const errorResponse = (message: string) =>
    NextResponse.redirect(new URL(`/login?auth_error=${encodeURIComponent(message)}`, origin));

  try {
    const { url, key } = getSupabasePublicEnv();
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            successResponse.cookies.set(name, value, options);
          });
        },
      },
    });

    const code = requestUrl.searchParams.get("code");
    const tokenHash = requestUrl.searchParams.get("token_hash");
    const type = requestUrl.searchParams.get("type");

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error("[Apollo] falha ao confirmar autenticação por código:", error.message);
        return errorResponse("O link de confirmação expirou ou já foi utilizado. Solicite um novo e-mail.");
      }
      await ensureUserProfile(supabase);
      return successResponse;
    }

    if (tokenHash && type) {
      const allowedTypes = ["signup", "email", "recovery", "invite", "magiclink", "email_change"] as const;
      if (!allowedTypes.includes(type as (typeof allowedTypes)[number])) {
        return errorResponse("Tipo de confirmação inválido. Solicite um novo e-mail.");
      }
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type as (typeof allowedTypes)[number],
      });
      if (error) {
        console.error("[Apollo] falha ao validar token de confirmação:", error.message);
        return errorResponse("O link de confirmação expirou ou já foi utilizado. Solicite um novo e-mail.");
      }
      await ensureUserProfile(supabase);
      return successResponse;
    }

    return errorResponse("Não encontramos um código de confirmação neste link. Solicite um novo e-mail.");
  } catch (error) {
    console.error("[Apollo] erro ao concluir autenticação/perfil:", error);
    return errorResponse(error instanceof Error ? error.message : "Não foi possível concluir a autenticação. Tente novamente.");
  }
}
