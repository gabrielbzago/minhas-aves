# Apollo 0.5.83 — confirmação visual do cadastro em lote

- Após a gravação bem-sucedida das anilhas, o botão “Salvar dados” deixa de ser exibido.
- No lugar dele aparece uma confirmação persistente na tela: “Dados salvos com sucesso!”, com a quantidade de anilhas gravadas.
- Em caso de erro, a mensagem de erro continua visível e os dados identificados permanecem disponíveis para correção e nova tentativa.
- Ao iniciar uma nova leitura/foto, a confirmação anterior é reiniciada.
- Mantida a captura pela câmera traseira do celular (`capture="environment"`).
- Nenhuma migração SQL necessária.
