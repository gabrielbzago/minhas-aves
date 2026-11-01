# Apollo 0.5.66 — Alternância de modo do Owner no celular

- Adicionado controle exclusivo do Owner no cabeçalho administrativo: Modo criador e Visão veterinário.
- No modo de criador emulado, o cabeçalho também oferece retorno ao Owner e acesso à visão veterinário, inclusive em telas móveis.
- A ativação continua protegida pelo endpoint `/api/owner/preview-mode`, que valida role owner ou `OWNER_EMAIL`.
- Não exige SQL nem novas variáveis. `OWNER_EMAIL` permanece opcional, com fallback já existente `gabrielbzago@gmail.com`.
