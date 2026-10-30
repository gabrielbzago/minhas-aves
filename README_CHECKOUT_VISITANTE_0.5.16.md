# Apollo v0.5.16 — checkout para visitantes

## Causa corrigida
A rota `/api/stripe/checkout` chamava `requireUser()` sem tratar a exceção `UNAUTHENTICATED`. Um visitante que clicasse em Assinar na página pública recebia HTTP 500. Usuários já logados passavam normalmente.

## Novo fluxo
- Visitante que clica em Assinar é enviado para `/login?next=/api/stripe/checkout?plan=...`.
- Após login por senha, Google OAuth (callback preserva `next`) ou Passkey, retorna ao endpoint do plano selecionado.
- O endpoint valida o plano antes da autenticação e só gera o Payment Link depois de confirmar usuário e perfil.
- Erros de sessão/perfil agora retornam mensagens controladas e logs no servidor, em vez de uma exceção não tratada.

## Banco
Nenhuma migration ou alteração no Supabase é necessária.

## Validação
ZIP criado e integridade conferida. Este ambiente não possui dependências do projeto instaladas; executar `npm install` e `npm run build` antes do deploy.
