# Apollo 0.5.8 — Lembretes inteligentes

## Regras implementadas

- Gala/acasalamento: não gera lembrete de postura, pois o intervalo até o primeiro ovo é variável.
- Postura: ao registrar o primeiro ovo, informe se a postura esperada é de 2 ou 3 ovos. O Apollo estima o início do choco para o dia do 2º ou 3º ovo (respectivamente), permitindo ajustar a data real em que a fêmea deitou.
- Choco: alerta no 11º, 12º e 13º dia, contando o primeiro dia de choco como dia 1. O alerta cessa ao registrar nascimento ou após o 13º dia.
- Anilhamento: alerta diariamente do 3º ao 7º dia após a data do nascimento. O alerta cessa quando o criador registra o evento Anilhamento realizado ou após o 7º dia.
- Os lembretes são exibidos no painel Calendário, calculados a partir dos eventos salvos. Não há envio de push, SMS ou e-mail nesta versão.

## Atualização do Supabase

Execute `supabase/migration_lembretes_inteligentes_0_5_8.sql` no SQL Editor do projeto Supabase atual. A migração só adiciona a coluna `incubation_start_date` e índices; não apaga nem recria registros.

## Publicação

Substitua o projeto pelo conteúdo do ZIP e publique na Vercel. Teste primeiro com uma fêmea de teste e datas controladas.
