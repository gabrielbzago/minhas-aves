# Minhas Aves v0.4.3 — Veterinário parceiro com acesso total

Esta versão altera o modelo do veterinário parceiro para ele funcionar em **dois ambientes no mesmo usuário**:

## 1. Uso próprio como criador

O veterinário continua podendo usar o Minhas Aves normalmente para o próprio criatório:

- Visão geral
- Meu plantel
- Cadastro e edição de aves
- Anilhas
- Genealogia
- Cartão de gaiola
- Impressão
- Recursos Profissionais/Lenda
- Transferências
- Configurações
- Assinatura (exibida como acesso parceiro)

O acesso de recursos é equivalente ao **Criador Lenda**, sem depender de uma assinatura comercial para o usuário veterinário.

## 2. Painel veterinário parceiro

O menu passa a mostrar também **Painel veterinário**.

No painel, o veterinário consegue:

- pesquisar criadores por nome, criatório ou CPF;
- selecionar qualquer criador ativo;
- visualizar o plantel completo;
- pesquisar por ave, anilha ou espécie;
- abrir o painel clínico da ave;
- registrar consultas particulares;
- anexar prontuário PDF;
- anexar receita PDF;
- registrar data, modalidade, descrição e observações;
- consultar o histórico veterinário;
- baixar os PDFs já arquivados.

As consultas particulares não dependem do plano Lenda do criador.

## Banco de dados

Depois de aplicar a versão anterior, execute no SQL Editor do Supabase:

`supabase/migration_veterinario_acesso_total_0_4_3.sql`

A migration:

- libera leitura de perfis para o veterinário parceiro;
- libera leitura do plantel completo;
- amplia a leitura/gestão do histórico clínico;
- remove o limite de 5 aves para o perfil veterinário;
- atualiza a função segura de conclusão de consultas.

## Importante

O usuário veterinário precisa continuar com `profiles.role = 'veterinarian'` e possuir um registro correspondente em `vet_profiles` com `is_active = true`.
