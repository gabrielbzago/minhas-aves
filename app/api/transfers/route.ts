import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { digitsOnlyCpf, isValidCpf } from '@/lib/cpf';

export async function GET() {
  const { user } = await requireUser();
  const admin = createAdminClient();
  const { data: rows, error } = await admin
    .from('bird_transfer_requests')
    .select('id,bird_id,sender_id,recipient_id,recipient_cpf,status,scope,note,created_at,responded_at,completed_at')
    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const ids = [...new Set((rows || []).flatMap((r: any) => [r.sender_id, r.recipient_id]).filter(Boolean))];
  const birdIds = [...new Set((rows || []).map((r: any) => r.bird_id).filter(Boolean))];
  const [{ data: profiles }, { data: birds }] = await Promise.all([
    ids.length ? admin.from('profiles').select('id,full_name,criatorio_name').in('id', ids) : Promise.resolve({ data: [] as any[] }),
    birdIds.length ? admin.from('birds').select('id,name,ring_number,status,species:species_id(common_name,scientific_name)').in('id', birdIds) : Promise.resolve({ data: [] as any[] }),
  ]);
  const pmap = new Map((profiles || []).map((p: any) => [p.id, p]));
  const bmap = new Map((birds || []).map((b: any) => [b.id, b]));
  const data = (rows || []).map((r: any) => ({
    ...r,
    sender: pmap.get(r.sender_id) || null,
    recipient: pmap.get(r.recipient_id) || null,
    bird: bmap.get(r.bird_id) || null,
  }));
  return NextResponse.json({ data, error: null });
}

export async function POST(request: Request) {
  const { supabase, user } = await requireUser();
  const body = await request.json();
  const birdId = String(body?.bird_id || '');
  const cpf = digitsOnlyCpf(body?.recipient_cpf);
  const note = String(body?.note || '').trim() || null;
  if (!birdId) return NextResponse.json({ error: 'Selecione a ave que será transferida.' }, { status: 400 });
  if (!isValidCpf(cpf)) return NextResponse.json({ error: 'Informe um CPF válido do criador que receberá a ave.' }, { status: 400 });

  const { data: profile } = await supabase.from('profiles').select('cpf').eq('id', user.id).maybeSingle();
  if (!isValidCpf(profile?.cpf)) {
    return NextResponse.json({ error: 'Cadastre e valide seu CPF em Configurações antes de solicitar uma transferência.' }, { status: 400 });
  }

  const { data, error } = await supabase.rpc('create_bird_transfer_request', {
    p_bird_id: birdId,
    p_recipient_cpf: cpf,
    p_note: note,
  });
  if (error) {
    const map: Record<string, string> = {
      CPF_DESTINATARIO_INVALIDO: 'O CPF do destinatário é inválido.',
      CPF_REMETENTE_NAO_CADASTRADO: 'Cadastre seu CPF em Configurações antes de transferir uma ave.',
      AVE_NAO_ENCONTRADA: 'Ave não encontrada no seu plantel.',
      AVE_NAO_PODE_SER_TRANSFERIDA: 'Somente aves ativas podem ser transferidas.',
      CRIADOR_DESTINATARIO_NAO_ENCONTRADO: 'Não encontramos um criador com esse CPF no Minhas Aves.',
      TRANSFERENCIA_JA_PENDENTE: 'Já existe uma solicitação pendente para esta ave.',
    };
    return NextResponse.json({ error: map[error.message] || error.message }, { status: 400 });
  }
  return NextResponse.json({ data: { id: data }, error: null }, { status: 201 });
}
