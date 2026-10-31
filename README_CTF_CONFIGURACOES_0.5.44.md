# Apollo 0.5.44 — CTF nas configurações e cartões

## Alterações
- Adicionado campo Número do CTF (IBAMA) em Configurações > Identidade do criatório.
- O valor é salvo em `profiles.ctf_number`.
- O cartão individual e a impressão em lote passam a carregar o CTF salvo e exibi-lo nos campos CTF da frente e do verso.
- Mantidos CPF, telefone, cidade, UF, responsável, nome e logo do criatório.

## SQL
Arquivo `supabase/migration_ctf_configuracoes_0_5_44.sql`:
`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ctf_number text;`
Execute apenas se a coluna ainda não existir. É seguro executar mesmo se já existir.

## Validação
Inspeção estática dos formulários, consultas de perfil e rotas de impressão. Build de produção e teste real no Supabase não foram executados neste ambiente.
