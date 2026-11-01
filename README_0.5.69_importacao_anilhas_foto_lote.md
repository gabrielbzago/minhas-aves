# Apollo 0.5.69 — Importação de anilhas por foto em lote

- Importação por foto habilitada no servidor somente para planos Profissional e Lenda (Owner/veterinário mantêm acesso administrativo).
- IA extrai lista de números; usuário revisa/edita antes de confirmar.
- Cada número vira um registro individual no estoque, com espécie escolhida e pai/mãe opcionais compartilhados pelo lote.
- Validação de duplicidades antes da gravação. Sexo inicia como indeterminado e status como disponível.
- Usa a tabela existente `ai_bird_scan_usage` e os limites mensais de IA do plano: Profissional 30, Lenda 100.

Sem migration SQL. A leitura exige `OPENAI_API_KEY` na Vercel.
