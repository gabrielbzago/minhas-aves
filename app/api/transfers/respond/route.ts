import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  const { supabase, user } = await requireUser();
  const body = await request.json();
  const requestId = String(body?.request_id || '');
  const accept = Boolean(body?.accept);
  if (!requestId) return NextResponse.json({ error: 'Solicitação de transferência não informada.' }, { status: 400 });

  const admin = createAdminClient();
  const { data: transfer } = await admin
    .from('bird_transfer_requests')
    .select('id,bird_id,sender_id,recipient_id,status')
    .eq('id', requestId)
    .maybeSingle();
  if (!transfer) return NextResponse.json({ error: 'Solicitação não encontrada.' }, { status: 404 });
  if (transfer.recipient_id !== user.id) return NextResponse.json({ error: 'Esta solicitação não pertence à sua conta.' }, { status: 403 });

  // Recusa não precisa tocar no Storage.
  if (!accept) {
    const { data, error } = await supabase.rpc('respond_bird_transfer_request', { p_request_id: requestId, p_accept: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ data, error: null });
  }

  // Antes de mudar o proprietário, copia os arquivos da galeria para a pasta do destinatário.
  // A operação de banco só avança se os arquivos puderem ser copiados.
  const { data: media } = await admin
    .from('bird_media')
    .select('id,storage_path,mime_type')
    .eq('bird_id', transfer.bird_id)
    .eq('user_id', transfer.sender_id);

  const copied: { id: string; from: string; to: string }[] = [];
  try {
    for (const item of media || []) {
      const original = String(item.storage_path || '');
      if (!original) continue;
      const fileName = original.split('/').pop() || `arquivo-${item.id}`;
      const destination = `${user.id}/transferencias/${requestId}/${fileName}`;
      const downloaded = await admin.storage.from('bird-media').download(original);
      if (downloaded.error || !downloaded.data) throw new Error(downloaded.error?.message || `Não foi possível copiar ${fileName}.`);
      const uploaded = await admin.storage.from('bird-media').upload(destination, downloaded.data, { upsert: true, contentType: item.mime_type || undefined });
      if (uploaded.error) throw new Error(uploaded.error.message);
      copied.push({ id: item.id, from: original, to: destination });
    }
  } catch (e:any) {
    if (copied.length) await admin.storage.from('bird-media').remove(copied.map(x => x.to));
    return NextResponse.json({ error: `A transferência não foi concluída porque um arquivo da ave não pôde ser copiado: ${e?.message || 'erro de armazenamento'}` }, { status: 400 });
  }

  const { data, error } = await supabase.rpc('respond_bird_transfer_request', {
    p_request_id: requestId,
    p_accept: true,
  });
  if (error) {
    if (copied.length) await admin.storage.from('bird-media').remove(copied.map(x => x.to));
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // A função SQL já transferiu os registros; agora aponta a galeria para os novos arquivos.
  for (const item of copied) {
    const { error: pathError } = await admin.from('bird_media').update({ storage_path: item.to }).eq('id', item.id).eq('bird_id', transfer.bird_id).eq('user_id', user.id);
    if (pathError) console.error('[Minhas Aves] Falha ao atualizar caminho de mídia transferida', pathError);
  }

  return NextResponse.json({ data, error: null });
}
