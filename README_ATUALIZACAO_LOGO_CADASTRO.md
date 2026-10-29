# Apollo — correção de cadastro e identidade visual

## Antes de tentar cadastrar novamente

1. No Supabase, abra **SQL Editor**.
2. Execute o arquivo `supabase/migration_fix_signup_trigger.sql` inteiro.
3. Confirme que o resultado mostra o trigger `on_auth_user_created`.
4. Tente criar a conta novamente. O formulário agora normaliza o e-mail para minúsculas.

A correção simplifica `handle_new_user`: ela cria o perfil básico com os campos principais e evita um `UPDATE` no conflito, reduzindo as possibilidades de um gatilho secundário impedir o cadastro no Supabase Auth.

## Ativar o veterinário

Depois que a conta existir em `auth.users`, execute `supabase/cadastro_veterinario_kaique_pedro.sql`. O endereço usado nesse arquivo é exatamente `kaique_marquess@hotmail.com` (dois “s” no final de `marquess`).

## Se ainda falhar

Execute `supabase/diagnostico_cadastro.sql` e envie o resultado, além da mensagem técnica registrada no Console do navegador (F12 → Console). Não envie senhas, tokens ou chaves secretas.
