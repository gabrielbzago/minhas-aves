# Google OAuth — Minhas Aves

O projeto já possui os botões **Continuar com Google** no login e **Cadastrar com Google** no cadastro. O fluxo usa Supabase Auth; o Client ID do Google não deve ser colocado em variáveis do frontend nem substitui a configuração do provedor no Supabase.

## Cliente OAuth criado no Google Cloud

- Tipo: **Aplicativo da Web**
- Client ID: `726944452755-9msipi9b6rbkc924qc8jo4876tgk3r9r.apps.googleusercontent.com`
- Nome público da aplicação: configure como **Minhas Aves** em Google Auth Platform → Branding.

O Client ID é identificador público. **Não publique nem coloque no repositório o Client Secret.**

## 1. Google Cloud — URIs autorizados

No cliente OAuth do tipo Aplicativo da Web, configure:

### Origens JavaScript autorizadas

- `https://www.minhasaves.com.br`
- `https://minhasaves.com.br`
- `http://localhost:3000` (somente desenvolvimento local)

### URIs de redirecionamento autorizados

Adicione o callback do Supabase exibido no painel do projeto, no formato:

`https://SEU-PROJETO.supabase.co/auth/v1/callback`

Substitua `SEU-PROJETO` pelo identificador real do projeto Supabase. O callback do Google é o endereço do Supabase — **não** use `/auth/confirm` neste campo.

## 2. Supabase — habilitar Google

1. Abra o projeto Supabase usado pelo Minhas Aves.
2. Entre em **Authentication → Sign In / Providers → Google** (o nome pode variar ligeiramente na interface).
3. Habilite Google.
4. Cole o Client ID acima.
5. Cole o **Client Secret** obtido no Google Cloud. Não o envie em conversas, não o coloque no código e não o comite no GitHub.
6. Salve.

## 3. Supabase — URLs de redirecionamento

Em **Authentication → URL Configuration**, configure:

- Site URL: `https://www.minhasaves.com.br`
- Redirect URL permitida: `https://www.minhasaves.com.br/auth/confirm`
- Opcional para domínio sem www: `https://minhasaves.com.br/auth/confirm`
- Desenvolvimento local: `http://localhost:3000/auth/confirm`

A aplicação usa `NEXT_PUBLIC_APP_URL` com o valor `https://www.minhasaves.com.br` em produção.

## 4. Fluxo já implementado no código

1. O usuário clica em Continuar com Google.
2. O Supabase inicia o OAuth usando `provider: "google"`.
3. O Google retorna para o callback `/auth/v1/callback` do Supabase.
4. O Supabase redireciona para `/auth/confirm`.
5. A rota `app/auth/confirm/route.ts` troca o código por uma sessão e redireciona ao dashboard.

## 5. Teste obrigatório antes da publicação

- Teste login e cadastro em `https://www.minhasaves.com.br`.
- Teste em janela anônima com uma conta Google que ainda não tenha entrado no sistema.
- Confirme que o retorno chega ao dashboard e que o perfil é criado no Supabase.
- Se aparecer `redirect_uri_mismatch`, compare literalmente a URI de callback do Supabase com a URI autorizada no Google Cloud.
- Se aparecer erro de provedor desabilitado ou `invalid_client`, revise Client ID/Client Secret e confirme que foram configurados no projeto Supabase correto.

**Limitação:** este arquivo documenta a configuração do OAuth; não é possível ativar o login apenas alterando o código/ZIP. Também é necessário salvar o Client Secret no painel do Supabase e confirmar as URLs reais do projeto. Não coloque credenciais secretas no GitHub.
