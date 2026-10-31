# Apollo 0.5.47 — Ajustes de cartões e espécie

## Alterações
- Datas de nascimento nos cartões e placas de gaiola exibidas em DD/MM/AAAA.
- Campo Registro removido do cartão dobrável; CTF permanece como identificação.
- Campo Anilha ampliado e com quebra de linha para exibir o número completo, sem reticências.
- Campos reorganizados para aproveitar o espaço liberado e manter as informações dentro dos quadrinhos.
- Placa de gaiola passa a exibir o CTF cadastrado no perfil, em vez de usar o número de registro individual da ave.
- Migração SQL para padronizar o nome científico de Papa-capim como *Sporophila nigricollis* nos registros existentes.

## SQL
Execute `supabase/migration_papa_capim_data_cartoes_0_5_47.sql` no SQL Editor do Supabase para corrigir registros já existentes no catálogo.

O `schema.sql` já continha o nome científico correto para novas instalações.

## Validação
- ZIP validado estruturalmente.
- Build Next.js não executado neste ambiente (dependências não instaladas).
