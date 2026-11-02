# Apollo 0.5.100 — Botões explícitos de pagamento na página inicial

- Corrigida a seção pública de planos em `app/page.tsx`.
- Cada plano pago mostra dois botões inequívocos: "Pagar com cartão" e "Pagar com Pix".
- Links mantêm a seleção de plano e método no cadastro: `plan=<plano>&method=<método>`.
- CSS dedicado força os dois botões a aparecerem lado a lado no desktop e empilhados no celular.
- Cadastro preserva o método selecionado e direciona ao endpoint de checkout após autenticação/validação.
- Nenhuma alteração nos preços, webhooks ou controle de vencimento da versão 0.5.99.
