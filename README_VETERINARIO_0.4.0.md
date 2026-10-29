# Minhas Aves 0.4.0 — Área operacional do veterinário parceiro

## O que foi implementado

- Painel do veterinário com todos os criadores do plano Lenda.
- Plantel completo dessas contas, com nome da ave, espécie, número da anilha, status e dados básicos.
- CPF do criador exibido na interface do veterinário.
- Busca por nome da ave, anilha, espécie, criatório, responsável ou CPF.
- Filtro por criador.
- Seleção de uma ave para abrir seu histórico veterinário.
- Registro de nova consulta pelo veterinário.
- Upload obrigatório de dois PDFs por consulta:
  - prontuário;
  - receita.
- Data, modalidade, descrição e observações do atendimento.
- PDFs continuam privados no bucket `vet-records` e são entregues por URL assinada através da API.
- O criador continua podendo somente baixar os documentos; não recebe permissão para fazer upload.
- Histórico da consulta aparece automaticamente na ficha da ave do criador.
- Owner ganhou a opção **Testar visão do veterinário**.
- O Owner pode selecionar criadores e aves no mesmo workspace para validar o fluxo.
- A simulação usa a mesma interface operacional do veterinário. Documentos enviados no modo de teste são reais e ficam gravados no histórico.
- Migration adicionada para permitir ao Owner consultar o plantel no modo de simulação.

## Supabase

Execute a migration `supabase/migration_veterinario_patrocinadores_lenda.sql` se ainda não tiver executado a versão anterior. Ela usa `IF NOT EXISTS`/`DROP POLICY IF EXISTS` nos pontos necessários para ser reaplicável.

A coluna `profiles.cpf` também é garantida nesta migration para que a área veterinária consiga exibir o CPF mesmo que a migration de transferências ainda não tenha sido executada.

## Fluxo

1. Criador Lenda solicita/agendamento ou Owner abre uma consulta de teste.
2. A consulta é vinculada à ave e ao veterinário parceiro ativo.
3. Veterinário seleciona a ave por nome/anilha.
4. Preenche atendimento e anexa prontuário + receita em PDF.
5. O sistema grava os documentos no Storage privado.
6. A consulta é marcada como concluída.
7. O histórico aparece na ficha da ave do criador com os dois downloads.
