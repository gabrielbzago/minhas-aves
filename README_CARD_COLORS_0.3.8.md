# Minhas Aves 0.3.8 — Paleta de cores dos cartões

Esta versão adiciona uma paleta de cores para o Cartão de Gaiola.

## Cores disponíveis
- Verde
- Azul
- Azul-real
- Vermelho
- Laranja
- Roxo
- Grafite
- Dourado

A cor escolhida é aplicada ao cartão individual e à impressão de múltiplos cartões em A4. A identidade do criatório (nome, responsável e logo) permanece intacta; apenas a cor principal visual do cartão é alterada.

A seleção é enviada como `theme` para as rotas de impressão. O banco de dados não precisa de migration para esse recurso.

## Rotas
- `/api/birds/card/[id]?theme=verde` — cartão individual, frente e verso.
- `/api/print/cards?theme=azul&ids=...` — impressão de múltiplos cartões.
