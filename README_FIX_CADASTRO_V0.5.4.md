# Apollo v0.5.4 — diagnóstico de cadastro

Esta versão muda o formulário para exibir a mensagem real retornada pelo Supabase quando o cadastro falha, em vez de sempre mostrar uma frase genérica. Também amplia `supabase/diagnostico_cadastro.sql` para listar todos os triggers de `auth.users`, a função associada, colunas obrigatórias e constraints de `public.profiles`.

## Próximos passos
1. Publique o conteúdo deste ZIP no repositório.
2. Tente cadastrar uma conta de teste.
3. Copie a mensagem técnica que aparecer na tela.
4. No Supabase SQL Editor, execute `supabase/diagnostico_cadastro.sql` e confira os resultados.

A causa final depende do erro real e do esquema atualmente instalado no seu projeto Supabase. Este pacote melhora o diagnóstico, mas não afirma que a conta foi criada nem que o banco remoto foi alterado.
