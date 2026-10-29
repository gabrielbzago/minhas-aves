# Minhas Aves v0.3.7 — Responsivo PC + Celular

## O que foi atualizado
- Layout adaptável para desktop, tablet e celular.
- Menu lateral desktop preservado.
- Menu mobile em gaveta (hamburger) com todos os módulos visíveis.
- Recursos bloqueados continuam clicáveis no celular e levam à tela de upgrade.
- Campos de formulário com tamanho adequado para toque e sem zoom involuntário no iOS.
- Tabelas principais adaptadas para leitura em telas pequenas.
- Cabeçalho reduzido e reorganizado no celular.
- Áreas de ação e botões quebram automaticamente sem sair da tela.
- Conteúdo com espaçamento inferior para não ficar atrás da navegação.

## Teste
Use Chrome DevTools > Toggle device toolbar e teste 320px, 375px, 390px, 768px e desktop.

Observação: o ambiente de empacotamento não possui `node_modules`, portanto `npm run build` precisa ser executado no projeto local após `npm install`.
