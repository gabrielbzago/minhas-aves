export function getAuthRedirectUrl() {
  const configuredSiteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    ""
  ).trim().replace(/\/+$/, "");
  const baseUrl = configuredSiteUrl || (typeof window !== "undefined" ? window.location.origin : "");
  if (!baseUrl) throw new Error("URL pública do Apollo não configurada.");
  return `${baseUrl}/auth/confirm`;
}
