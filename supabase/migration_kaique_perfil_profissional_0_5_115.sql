-- Apollo 0.5.115 — perfil público e editável do veterinário Kaique Pedro
-- Idempotente. Execute no Supabase SQL Editor após aplicar o pacote.
-- Não altera credenciais, autenticação ou permissões de assinaturas.

do $$
declare
  v_user_id uuid;
begin
  select id into v_user_id
  from auth.users
  where lower(email) = lower('Kaique_marques@hotmail.com')
  limit 1;

  if v_user_id is null then
    raise notice 'Conta do Kaique ainda não existe; a migração de perfil foi ignorada.';
    return;
  end if;

  update public.profiles
  set full_name = 'Kaique Pedro',
      city = 'Espírito Santo do Pinhal',
      state = 'SP',
      role = 'veterinarian',
      updated_at = now()
  where id = v_user_id;

  insert into public.vet_profiles (
    id, display_name, photo_url, bio, specialties, city, state,
    whatsapp, online_available, in_person_available, is_active
  ) values (
    v_user_id,
    'Kaique Pedro',
    '/veterinarios/kaique-pedro.png',
    $bio$
Meu nome é Kaique Pedro, tenho 31 anos e sou médico-veterinário, formado em 2025. Também sou formado em Logística e atualmente sou proprietário da Clínica Veterinária Vivaz, em Espírito Santo do Pinhal – SP, onde atuo no atendimento clínico de animais de pequeno porte e, principalmente, na medicina de aves.

Minha trajetória com as aves começou muito antes da minha formação acadêmica. Sou criador de aves desde os oito anos de idade, com experiência especialmente na criação de passeriformes, tendo como principais espécies o coleiro e o trinca-ferro. Essa vivência prática despertou meu interesse pela medicina aviária e contribuiu diretamente para minha escolha profissional.

Ao longo da minha formação, busquei aprimorar meus conhecimentos por meio de cursos voltados à clínica médica, manejo, clínica cirúrgica e, mais recentemente, anestesiologia veterinária voltada para aves.

Em relação à experiência prática, realizei um estágio de três meses no Criatório Veneno, onde tive a oportunidade de aprofundar meus conhecimentos na criação e no manejo de passeriformes. Posteriormente, retornei ao criatório para atuar diretamente no acompanhamento da reprodução de coleiros e na rotina de clínica médica.

Durante esse período, participei de atividades relacionadas ao controle sanitário do plantel, manejo produtivo, acompanhamento reprodutivo, ajustes nutricionais e atendimento clínico das aves.

Acredito que a combinação entre vivência na criação, conhecimento técnico e formação veterinária é um diferencial importante na minha atuação, especialmente na medicina de aves.
$bio$,
    $spec$Medicina de aves; clínica médica de pequenos animais; manejo e clínica de passeriformes; acompanhamento reprodutivo; clínica cirúrgica; anestesiologia veterinária voltada para aves$spec$,
    'Espírito Santo do Pinhal',
    'SP',
    '5519991799167',
    true,
    true,
    true
  )
  on conflict (id) do update set
    display_name = excluded.display_name,
    photo_url = coalesce(public.vet_profiles.photo_url, excluded.photo_url),
    bio = excluded.bio,
    specialties = excluded.specialties,
    city = excluded.city,
    state = excluded.state,
    whatsapp = coalesce(public.vet_profiles.whatsapp, excluded.whatsapp),
    online_available = true,
    in_person_available = true,
    is_active = true,
    updated_at = now();
end $$;

-- Bucket público para a foto de apresentação; cada veterinário só grava na própria pasta.
insert into storage.buckets (id, name, public)
values ('vet-profile-photos', 'vet-profile-photos', true)
on conflict (id) do update set public = true;

drop policy if exists "vet_profile_photo_public_read" on storage.objects;
create policy "vet_profile_photo_public_read" on storage.objects
for select to public using (bucket_id = 'vet-profile-photos');

drop policy if exists "vet_profile_photo_owner_insert" on storage.objects;
create policy "vet_profile_photo_owner_insert" on storage.objects
for insert to authenticated
with check (bucket_id = 'vet-profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "vet_profile_photo_owner_update" on storage.objects;
create policy "vet_profile_photo_owner_update" on storage.objects
for update to authenticated
using (bucket_id = 'vet-profile-photos' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'vet-profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);
