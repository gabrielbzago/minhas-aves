import { requireUser } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import TransferManager from '@/components/transfer-manager';

export default async function TransferenciasPage({searchParams}:{searchParams?:Promise<{ave?:string}>}) {
  const { supabase, user } = await requireUser();
  const params = searchParams ? await searchParams : {};
  const initialBirdId = params.ave || undefined;
  const admin = createAdminClient();
  const [{ data: profile }, { data: birds }, { data: rows }] = await Promise.all([
    supabase.from('profiles').select('cpf').eq('id', user.id).maybeSingle(),
    supabase.from('birds').select('id,name,ring_number,status,is_genealogy_reference,species:species_id(common_name,scientific_name)').eq('is_genealogy_reference', false).order('name'),
    admin.from('bird_transfer_requests').select('id,bird_id,sender_id,recipient_id,recipient_cpf,status,scope,note,created_at,responded_at,completed_at').or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`).order('created_at',{ascending:false}),
  ]);
  const ids=[...new Set((rows||[]).flatMap((r:any)=>[r.sender_id,r.recipient_id]).filter(Boolean))];
  const birdIds=[...new Set((rows||[]).map((r:any)=>r.bird_id).filter(Boolean))];
  const [{data:profiles},{data:transferBirds}]=await Promise.all([
    ids.length?admin.from('profiles').select('id,full_name,criatorio_name').in('id',ids):Promise.resolve({data:[]}),
    birdIds.length?admin.from('birds').select('id,name,ring_number,status,species:species_id(common_name,scientific_name)').in('id',birdIds):Promise.resolve({data:[]}),
  ]);
  const pmap=new Map((profiles||[]).map((p:any)=>[p.id,p]));
  const bmap=new Map((transferBirds||[]).map((b:any)=>[b.id,b]));
  const transfers=(rows||[]).map((r:any)=>({...r,sender:pmap.get(r.sender_id),recipient:pmap.get(r.recipient_id),bird:bmap.get(r.bird_id)}));
  return <main className="content"><div className="page-title"><div><span className="kicker">Plantel</span><h1>Transferências</h1><p>Envie e receba aves de outros criadores que utilizam o Minhas Aves.</p></div></div><div className="card" style={{marginBottom:18}}><strong>Importante</strong><p style={{margin:'6px 0 0',color:'var(--muted)'}}>Esta ferramenta registra a operação dentro do software. Para passeriformes silvestres sujeitos ao SisPass, a transferência oficial perante o órgão ambiental continua devendo ser realizada no sistema oficial quando aplicável. O CPF é usado aqui para identificar a conta destinatária.</p></div><TransferManager birds={birds||[]} transfers={transfers} myCpf={profile?.cpf||null} userId={user.id} initialBirdId={initialBirdId}/></main>;
}
