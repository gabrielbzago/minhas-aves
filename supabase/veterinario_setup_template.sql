-- Preencha os campos entre aspas antes de executar.
-- 1) Crie o usuário do veterinário em Authentication > Users.
-- 2) Copie o UUID do usuário.

update public.profiles
set role='veterinarian'
where id='UUID_DO_VETERINARIO';

insert into public.vet_profiles(
  id,display_name,crmv,photo_url,bio,specialties,address,city,state,whatsapp,
  online_available,in_person_available,partnership_terms
) values (
  'UUID_DO_VETERINARIO',
  'NOME DO VETERINÁRIO',
  'CRMV/UF XXXXX',
  'https://SEU-ENDERECO-DA-FOTO',
  'BIOGRAFIA DO VETERINÁRIO',
  'Aves silvestres',
  'ENDEREÇO DO CONSULTÓRIO',
  'CIDADE',
  'UF',
  '5511999999999',
  true,
  true,
  'Descreva aqui as cláusulas comerciais e operacionais da parceria.'
)
on conflict (id) do update set
 display_name=excluded.display_name,crmv=excluded.crmv,photo_url=excluded.photo_url,bio=excluded.bio,
 specialties=excluded.specialties,address=excluded.address,city=excluded.city,state=excluded.state,
 whatsapp=excluded.whatsapp,online_available=excluded.online_available,in_person_available=excluded.in_person_available,
 partnership_terms=excluded.partnership_terms;

-- Owner da plataforma:
-- update public.profiles set role='owner' where id='UUID_DO_OWNER';

-- FM Eletrônica já é criada pela migration. Para colocar a logo:
-- update public.sponsors set logo_url='/sponsors/fm-eletronica.png' where name='FM Eletrônica';
