-- Minhas Aves / Apollo — cadastro do veterinário Kaique Pedro
-- Execute SOMENTE DEPOIS que ele criar a conta em /cadastro e confirmar o e-mail.
-- Não define nem armazena senha: o próprio veterinário escolhe a senha no cadastro.
-- Idempotente: pode executar novamente sem duplicar o perfil.

do $$
declare
  v_user_id uuid;
begin
  select id into v_user_id
  from auth.users
  where lower(email) = lower('Kaique_marques@hotmail.com')
  limit 1;

  if v_user_id is null then
    raise exception 'Conta não encontrada. Peça ao veterinário para criar a conta com o e-mail Kaique_marques@hotmail.com e confirmar o e-mail; depois execute este SQL novamente.';
  end if;

  insert into public.profiles (
    id, full_name, phone, city, state, role
  ) values (
    v_user_id,
    'Kaique Pedro',
    '19991799167',
    'Espírito Santo do Pinhal',
    'SP',
    'veterinarian'
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    phone = excluded.phone,
    city = excluded.city,
    state = excluded.state,
    role = 'veterinarian',
    updated_at = now();

  insert into public.vet_profiles (
    id, display_name, bio, address, city, state, whatsapp,
    online_available, in_person_available, is_active
  ) values (
    v_user_id,
    'Kaique Pedro',
    'Clínica Vivaz',
    'Coronel Antônio Augusto, 348, Centro',
    'Espírito Santo do Pinhal',
    'SP',
    '5519991799167',
    true,
    true,
    true
  )
  on conflict (id) do update set
    display_name = excluded.display_name,
    bio = excluded.bio,
    address = excluded.address,
    city = excluded.city,
    state = excluded.state,
    whatsapp = excluded.whatsapp,
    online_available = true,
    in_person_available = true,
    is_active = true,
    updated_at = now();

  raise notice 'Perfil veterinário configurado com sucesso para Kaique Pedro.';
end $$;
