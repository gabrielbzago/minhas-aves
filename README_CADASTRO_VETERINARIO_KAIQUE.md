# Cadastro do veterinário — Kaique Pedro

## Como ativar o acesso sem criar uma senha provisória

1. Confirme que as migrations principais do Supabase já foram executadas, especialmente `migration_veterinario_patrocinadores_lenda.sql` e `migration_veterinario_acesso_total_0_4_3.sql`.
2. Envie ao veterinário o endereço do sistema e peça para ele criar a própria conta em **Criar conta**, usando exatamente `kaique_marquess@hotmail.com`. Ele define a própria senha; não compartilhe nem grave senha provisória no SQL.
3. Peça que confirme o e-mail, se o Supabase exigir confirmação.
4. No Supabase, abra **SQL Editor**, cole e execute o conteúdo de `supabase/cadastro_veterinario_kaique_pedro.sql`.
5. Peça para ele sair e entrar novamente. O perfil passa a ter o papel `veterinarian` e o cadastro público do consultório fica ativo.

O SQL procura a conta pelo e-mail, atualiza/cria o perfil de forma idempotente e interrompe com uma mensagem clara se a conta ainda não existir. CRMV não foi preenchido porque não veio nos dados fornecidos; confirme o número e registre-o depois, se necessário.

## Dados cadastrados

- Nome: Kaique Pedro
- E-mail de acesso: kaique_marquess@hotmail.com
- Telefone/WhatsApp: (19) 99179-9167
- Clínica: Vivaz
- Endereço: Coronel Antônio Augusto, 348, Centro
- Cidade/UF: Espírito Santo do Pinhal - SP
- Atendimento online e presencial: habilitados

## Observação

O SQL não cria usuários no Supabase Auth nem define senha. A criação da conta deve ser feita pelo próprio veterinário no fluxo normal do sistema, garantindo que só ele conheça a senha.
