# Apollo v0.5.104 — correção do fluxo de convite e definição de senha

## Problema identificado
Na versão 0.5.103, `/auth/confirm` aceitava `type=invite`, validava o token e redirecionava diretamente ao dashboard. Não havia uma etapa dedicada para o convidado definir sua senha. O login normal usa `signInWithPassword`, que exige uma senha previamente cadastrada.

## Correção
- Convites identificados com `type=invite` passam a redirecionar para `/definir-senha`.
- A nova tela valida a sessão autenticada do convite.
- O usuário define e confirma uma senha com no mínimo 8 caracteres.
- A senha é gravada pelo Supabase Auth (`updateUser({ password })`).
- Após salvar, o usuário segue para `/dashboard`.
- Os fluxos comuns de cadastro, recuperação e OAuth mantêm o redirecionamento anterior.

## Publicação
Não exige migration SQL nem alteração de variáveis de ambiente. Publique a versão 0.5.104 na Vercel.

## Importante para o convite já enviado
O usuário afetado deve abrir novamente o link de convite original, desde que ainda esteja válido. Se expirou ou já foi consumido, gere e envie um novo convite. Depois de concluir a definição da senha, entre com o e-mail e a nova senha.

## Validação
ZIP estruturado e arquivos revisados. `next build` não foi executado neste ambiente; confirme o build na Vercel antes de considerar a correção em produção.
