import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json(
      { success: false, error: "A proteção antirrobô não está configurada no servidor." },
      { status: 503 },
    );
  }

  let token: unknown;
  try {
    ({ token } = await request.json());
  } catch {
    return NextResponse.json({ success: false, error: "Solicitação inválida." }, { status: 400 });
  }

  if (typeof token !== "string" || token.length < 10 || token.length > 2048) {
    return NextResponse.json({ success: false, error: "Conclua a verificação de segurança." }, { status: 400 });
  }

  const formData = new FormData();
  formData.set("secret", secret);
  formData.set("response", token);
  const forwardedFor = request.headers.get("x-forwarded-for");
  const remoteIp = forwardedFor?.split(",")[0]?.trim();
  if (remoteIp) formData.set("remoteip", remoteIp);

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: formData,
      cache: "no-store",
    });
    if (!response.ok) {
      return NextResponse.json({ success: false, error: "Não foi possível validar a verificação. Tente novamente." }, { status: 502 });
    }
    const result = (await response.json()) as { success?: boolean };
    if (!result.success) {
      return NextResponse.json({ success: false, error: "A verificação expirou ou não foi concluída. Tente novamente." }, { status: 400 });
    }
    return NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ success: false, error: "Falha ao validar a verificação. Confira sua conexão e tente novamente." }, { status: 502 });
  }
}
