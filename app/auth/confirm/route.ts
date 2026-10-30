import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

function safeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  return value;
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
      return successResponse;
    }

    return errorResponse("Não encontramos um código de confirmação neste link. Solicite um novo e-mail.");
  } catch (error) {
    console.error("[Apollo] erro inesperado na rota /auth/confirm:", error);
    return errorResponse("Não foi possível concluir a confirmação. Tente novamente ou solicite um novo e-mail.");
  }
}
