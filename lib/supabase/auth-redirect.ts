/**
 * OAuth/email confirmation must return to the exact public origin where the
 * user started the flow. In the browser, window.location.origin is
 * authoritative and prevents a stale NEXT_PUBLIC_* build variable such as
 * http://localhost:3000 from hijacking production redirects.
 */
export function getAuthRedirectUrl(nextPath?: string) {
  const browserOrigin =
    typeof window !== "undefined" ? window.location.origin : "";

  const configuredSiteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    ""
  ).trim().replace(/\/+$/, "");

  const baseUrl = browserOrigin || configuredSiteUrl;
  if (!baseUrl) throw new Error("URL pública do Apollo não configurada.");

  const redirectUrl = new URL("/auth/confirm", baseUrl);
  if (nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")) {
    redirectUrl.searchParams.set("next", nextPath);
  }
  return redirectUrl.toString();
}
