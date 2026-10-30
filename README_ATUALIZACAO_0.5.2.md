# Apollo / Minhas Aves — atualização 0.5.2

## O que mudou
- Campos de senha com botão para mostrar/ocultar no login e cadastro.
- Login por Passkey (biometria do aparelho, PIN, Windows Hello ou autenticador compatível).
- Cadastro de Passkey na página Dashboard → Configurações.
- Cliente Supabase com opt-in experimental para Passkeys.
- Dependência `@supabase/supabase-js` atualizada para `^2.105.0` (lockfile resolve 2.112.3).
- Documentação passo a passo do Google OAuth e da ativação de Passkeys.

## Ações obrigatórias nos painéis externos
1. Supabase → Authentication → Passkeys: ativar e configurar RP Display Name `Apollo - Minhas Aves`, RP ID `minhasaves.com.br`, origins `https://www.minhasaves.com.br,https://minhasaves.com.br`.
2. Google Cloud: conferir/criar cliente OAuth Web, origens autorizadas e callback exato do Supabase.
3. Supabase → Authentication → Sign In / Providers → Google: habilitar e salvar Client ID + Client Secret.
4. Supabase → Authentication → URL Configuration: Site URL e Redirect URLs conforme `docs/GOOGLE_AUTH.md`.

## Importante
- O Client Secret do Google nunca deve ser enviado no chat, incluído no frontend ou commitado no GitHub.
- A API do Supabase Passkeys é experimental. Testar primeiro em produção controlada.
- Não foi possível executar `npm ci`/`next build` neste ambiente porque a instalação das dependências excedeu o tempo limite de rede. O código foi revisado estaticamente, mas a compilação ainda precisa ser validada no ambiente de deploy.
