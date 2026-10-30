export function getAuthRedirectUrl(nextPath?: string) {
  const configuredSiteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    ""
  ).trim().replace(/\/+$/, "");
  const baseUrl = configuredSiteUrl || (typeof window !== "undefined" ? window.location.origin : "");
  if (!baseUrl) throw new Error("URL pública do Apollo não configurada.");
  const redirectUrl = new URL("/auth/confirm", baseUrl);
  if (nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")) {
    redirectUrl.searchParams.set("next", nextPath);
  }
  return redirectUrl.toString();
}
