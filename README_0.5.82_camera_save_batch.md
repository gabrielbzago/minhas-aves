# Apollo 0.5.82 — câmera e gravação de lote

- Restaura a captura pela câmera traseira do celular com `capture="environment"`.
- O botão principal passa a ser “Tirar foto da lista”.
- A gravação do lote passa a usar o mesmo cliente Supabase autenticado do cadastro individual de anilhas, com validação de sessão, espécie, matrizes e duplicidades antes do insert.
- Erros de gravação são apresentados no painel, sem limpar a revisão.
- O botão de salvar não fica silenciosamente desabilitado quando falta selecionar espécie; a validação explica o que falta.
- Não altera schema nem exige SQL.
