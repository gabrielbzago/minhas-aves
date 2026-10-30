/**
 * URL OAuth/callback fixa para produção.
 * Não depende de window.location.origin nem de variáveis NEXT_PUBLIC_*,
 * pois uma configuração local antiga não pode redirecionar usuários de produção.
 */
const PRODUCTION_ORIGIN = "https://minhasaves.com.br";

export function getAuthRedirectUrl(nextPath?: string) {
  const redirectUrl = new URL("/auth/confirm", PRODUCTION_ORIGIN);
  if (nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")) {
    redirectUrl.searchParams.set("next", nextPath);
  }
  return redirectUrl.toString();
}
