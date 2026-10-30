# Apollo v0.5.14 — correção do retorno de confirmação de e-mail

## O que foi corrigido no código
- Criada a rota `app/auth/confirm/route.ts`, que troca o `code` por sessão Supabase (`exchangeCodeForSession`) e também aceita `token_hash` + `type` (`verifyOtp`).
- O cadastro e o OAuth agora usam um helper central de URL de retorno.
- O helper prioriza `NEXT_PUBLIC_SITE_URL`, depois `NEXT_PUBLIC_APP_URL`, e só usa a origem do navegador como fallback.
- A rota de confirmação redireciona para `/dashboard` após validar e grava os cookies da sessão no retorno.
- Erros de link expirado/inválido retornam ao login com mensagem segura, sem mostrar segredos.

## Configuração obrigatória na Vercel
Configure `NEXT_PUBLIC_APP_URL` com o valor exato:
`https://minhasaves.com.br`

Opcionalmente, configure também:
`NEXT_PUBLIC_SITE_URL=https://minhasaves.com.br`

Depois de alterar variáveis, faça um novo deploy (redeploy) para que as variáveis públicas entrem no bundle.

## Configuração obrigatória no Supabase
Authentication > URL Configuration:
- Site URL: `https://minhasaves.com.br`
- Redirect URLs:
  - `https://minhasaves.com.br/auth/confirm`
  - `https://www.minhasaves.com.br/auth/confirm`
  - `http://localhost:3000/auth/confirm` (somente para desenvolvimento local)

No template de confirmação de cadastro, mantenha o link:
`{{ .ConfirmationURL }}`
Não coloque `localhost` diretamente no template.

## Importante para o usuário que recebeu o link antigo
Links de confirmação já enviados mantêm o redirecionamento que foi gerado quando o e-mail foi criado. Depois de publicar a correção e conferir a configuração do Supabase, reenvie a confirmação para a conta pendente. O link antigo do Kaique pode continuar levando ao localhost; ele não é atualizado retroativamente.

## Segurança
Não compartilhe `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` nem o segredo do Google. Essas chaves não são necessárias para corrigir o retorno de confirmação.
