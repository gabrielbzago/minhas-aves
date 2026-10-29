import type { SupabaseClient } from '@supabase/supabase-js';

const BUCKET = 'criatorio-brand';

export async function getCriatorioLogoUrl(supabase: SupabaseClient, path?: string | null, expiresIn = 3600) {
  if (!path) return '';
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiresIn);
  return error ? '' : (data?.signedUrl || '');
}

export async function getCriatorioLogoDataUrl(supabase: SupabaseClient, path?: string | null) {
  if (!path) return '';
  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  if (error || !data) return '';
  const buffer = Buffer.from(await data.arrayBuffer());
  const type = data.type || mimeFromPath(path);
  return `data:${type};base64,${buffer.toString('base64')}`;
}

function mimeFromPath(path: string) {
  const ext = path.split('.').pop()?.toLowerCase();
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'webp') return 'image/webp';
  return 'image/png';
}
