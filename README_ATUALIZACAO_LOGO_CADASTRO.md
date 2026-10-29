# Apollo — atualização da marca e correção do cadastro

## Marca
O logo enviado foi instalado em `public/branding/apollo-logo.png` e aplicado na página inicial, login, cadastro, página pública do veterinário e menus do painel. O fundo das áreas de logo agora é branco para manter o contraste do símbolo preto. O ícone do navegador também foi atualizado.

## Cadastro
A tela de cadastro agora exige a verificação Cloudflare Turnstile, igual ao fluxo de login, e registra detalhes técnicos do erro no console para evitar mensagens genéricas sem diagnóstico. Para funcionar, as variáveis `NEXT_PUBLIC_TURNSTILE_SITE_KEY` e `TURNSTILE_SECRET_KEY` devem estar configuradas no ambiente de deploy.

Se o erro do cadastro for `Database error saving new user`, execute `supabase/migration_fix_signup_trigger.sql` no Supabase SQL Editor. Essa migration reinstala o trigger `on_auth_user_created` com a função `handle_new_user` compatível com o perfil atual. A migration também garante as colunas `full_name`, `criatorio_name`, `ctf_number` e `amador_trial_eligible` usadas pelo trigger.

## Validação
A alteração de arquivos foi aplicada ao código-fonte. O cadastro real precisa ser testado no ambiente com as variáveis Supabase/Turnstile configuradas; não é possível validar a criação de usuário sem acesso ao projeto Supabase.
