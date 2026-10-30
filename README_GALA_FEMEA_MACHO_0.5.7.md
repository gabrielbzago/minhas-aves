# Apollo / Minhas Aves — v0.5.7

## Ajuste: gala vinculada à fêmea e ao macho

O formulário de gala/acasalamento agora exige:
- Fêmea cadastrada no plantel (campo principal do evento).
- Macho cadastrado no mesmo plantel (campo `Macho que galou`).

O vínculo é salvo em `calendar_events.bird_id` (fêmea) e `calendar_events.partner_bird_id` (macho). O histórico e a agenda exibem os dois animais. Ao filtrar pelo macho, as galas em que ele participou também aparecem.

## Migração obrigatória no Supabase

1. Abra o projeto Supabase usado pelo Apollo em produção.
2. Entre em **SQL Editor** e crie uma nova query.
3. Copie e execute o arquivo `supabase/migration_gala_parceiro_macho.sql`.
4. Aguarde a mensagem de sucesso.
5. Publique este projeto na Vercel.

A migração é aditiva: cria a coluna `partner_bird_id`, sua chave estrangeira e índice, e atualiza as políticas RLS para garantir que o macho também pertença ao usuário autenticado. Galas antigas são preservadas; registros antigos sem parceiro continuam legíveis e podem ser editados para selecionar o macho.

## Validação

O backend valida que a fêmea e o macho pertencem ao plantel do usuário autenticado e que os sexos são compatíveis. O navegador não decide a autorização. A consulta do histórico identifica as duas relações com suas respectivas chaves estrangeiras.
