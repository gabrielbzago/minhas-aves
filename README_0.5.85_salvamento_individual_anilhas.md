# Apollo 0.5.85 — Salvamento individual de anilhas

- Cada anilha reconhecida é enviada em uma requisição própria ao endpoint autenticado.
- A tela mostra `Salvando N/total...` e atualiza o progresso a cada registro.
- Um erro em uma anilha não interrompe as demais; ao final, as anilhas não confirmadas permanecem na revisão para correção/tentativa.
- A confirmação de sucesso integral só aparece quando todas as anilhas foram confirmadas pelo servidor.
- Cada registro novo continua sendo criado com sexo `indeterminado` e status `disponivel`, conforme regra do endpoint.
- Sem alteração de schema; não requer SQL.
