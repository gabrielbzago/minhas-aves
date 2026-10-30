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
