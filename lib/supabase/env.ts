export function getSupabasePublicEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)?.trim();

  if (!url || !/^https?:\/\//i.test(url)) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL não configurada. Use a URL do seu projeto Supabase, por exemplo https://xxxxx.supabase.co.');
  }
  if (!key || key.length < 20 || /^(COL|SEU|YOUR|xxx)/i.test(key)) {
    throw new Error('Chave pública do Supabase não configurada. Preencha NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (ou NEXT_PUBLIC_SUPABASE_ANON_KEY) no .env.local.');
  }
  return { url, key };
}
