# Apollo 0.5.101 — Correção TypeScript do webhook Pix

Corrige as duas referências a `now.toISOString()` dentro de `activatePixCheckout`, onde `now` não existia após a alteração do cálculo do período anual. As rotinas de histórico/payout do plano Lenda agora recebem `periodStart.toISOString()`, a mesma data usada para iniciar o período anual registrado no perfil.

Mantém os botões de Cartão e Pix na página inicial e os recursos de renovação/aviso da 0.5.99/0.5.100.

Validação: ZIP íntegro e as duas referências indefinidas foram removidas. O build Next.js ainda precisa ser executado na Vercel.
