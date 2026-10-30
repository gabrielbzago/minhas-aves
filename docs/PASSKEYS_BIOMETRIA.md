# Passkeys / biometria — Apollo Minhas Aves

O projeto usa Passkeys (WebAuthn) pelo Supabase Auth. O navegador não entrega a impressão digital ao Apollo: a confirmação é feita pelo autenticador do aparelho ou gerenciador de credenciais.

## O que foi implementado no código

- O cliente Supabase habilita explicitamente `auth.experimental.passkey`.
- O login oferece **Entrar com biometria / Passkey**, usando `supabase.auth.signInWithPasskey()`.
- Configurações da conta oferece cadastro de Passkey, usando `supabase.auth.registerPasskey()`.
- Os campos de senha no login e cadastro têm controle para mostrar/ocultar o que está sendo digitado.

## Requisito de versão

O suporte a Passkeys exige `@supabase/supabase-js` 2.105.0 ou posterior. O `package.json` foi atualizado para `^2.105.0`; o lockfile incluído resolve uma versão 2.112.3.

## Ativar no painel Supabase — obrigatório

1. Abra o projeto correto no Supabase.
2. Vá para **Authentication → Passkeys**.
3. Ative **Enable Passkey authentication**.
4. Configure:
   - Relying Party Display Name: `Apollo - Minhas Aves`
   - Relying Party ID: `minhasaves.com.br`
   - Relying Party Origins: `https://www.minhasaves.com.br,https://minhasaves.com.br`
5. Salve.

Atenção: escolha o RP ID com cuidado. Alterá-lo depois invalida as Passkeys já cadastradas. Use exatamente os domínios que servem a aplicação. HTTPS é obrigatório em produção.

## Como o usuário cadastra

1. Entrar normalmente com e-mail/senha ou Google.
2. Confirmar o e-mail da conta.
3. Abrir Dashboard → Configurações.
4. Na seção **Acesso por biometria**, clicar em **Cadastrar biometria neste dispositivo**.
5. Confirmar no prompt do Android, iPhone ou computador. O sistema pode oferecer impressão digital, Face ID/Touch ID, PIN, Windows Hello ou gerenciador de Passkeys, conforme o dispositivo.
6. No próximo acesso, clicar em **Entrar com biometria / Passkey** na tela de login.

## Limitações e segurança

- O suporte a Passkeys do Supabase está experimental; valide em homologação antes de divulgar amplamente.
- Cada dispositivo/gerenciador pode precisar cadastrar sua própria Passkey. A sincronização depende do ecossistema do usuário.
- É necessário domínio HTTPS e navegador compatível.
- O cadastro de Passkey exige usuário autenticado, confirmado e não anônimo.
- Mantenha login por e-mail/senha e recuperação de conta como alternativa.
