# Apollo v0.5.5 — Calendário reprodutivo e torneios

## Novidades
- Calendário mensal com filtros Todos, Fêmeas e Machos.
- Fêmeas: eventos de postura (quantidade de ovos), gala/acasalamento, nascimento (quantidade de filhotes) e anilhamento.
- Ao registrar nascimento, o sistema cria automaticamente um lembrete de anilhamento entre 3 e 7 dias depois (padrão: 5 dias; configurável no cadastro). Se a data do nascimento ou o intervalo forem editados, o lembrete vinculado também é atualizado; ao excluir o nascimento, o lembrete automático é removido.
- Machos: torneios com data, local, quantidade de cantos, resultado/colocação e observações.
- Agenda diária, histórico geral, edição e exclusão de eventos.
- Eventos vinculados à ave e protegidos pelo usuário autenticado no Supabase (RLS).

## Instalação obrigatória no Supabase
1. Abra o projeto Supabase usado atualmente pelo Apollo.
2. Entre em SQL Editor → New query.
3. Copie e execute o arquivo `supabase/migration_calendario_reproducao_torneios.sql`.
4. Publique a versão 0.5.5 do projeto.

A migração cria somente a tabela `public.calendar_events`, seus índices, trigger e políticas RLS. Não substitui nem altera as tabelas de aves, perfis, autenticação ou assinatura.

## Acesso
No menu do painel, abra **Calendário** ou acesse `/dashboard/calendario`.

## Observação sobre anilhamento
A data automática é um lembrete operacional calculado a partir da data de nascimento informada pelo tutor. O intervalo pode ser selecionado entre 3 e 7 dias. O tutor deve confirmar a condição dos filhotes e as orientações aplicáveis antes de realizar o procedimento.

## Divulgação pública — v0.5.6
A página inicial (`app/page.tsx`) agora apresenta o calendário reprodutivo e de torneios em uma seção própria, detalha os recursos para fêmeas e machos, inclui agenda mensal/diária e histórico editável, amplia a lista de módulos e direciona visitantes para cadastro e planos de assinatura. Os planos e links de checkout existentes foram preservados.


## v0.5.8 — Lembretes inteligentes

- Postura: seleção de 2 ou 3 ovos e estimativa automática da data de início do choco a partir do primeiro ovo, com possibilidade de ajuste manual.
- Choco: lembretes no 11º, 12º e 13º dia, contando o primeiro dia de choco como dia 1. Encerram ao registrar nascimento ou após o 13º dia.
- Anilhamento: lembretes diários do 3º ao 7º dia após o nascimento. Encerram ao registrar anilhamento realizado ou após o 7º dia.
- Os alertas são exibidos dentro do painel Calendário; esta versão não envia push, SMS ou e-mail.
- Execute `supabase/migration_lembretes_inteligentes_0_5_8.sql`.
