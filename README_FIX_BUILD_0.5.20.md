# Apollo 0.5.20 — correção de build

Corrigido `app/api/stripe/webhook/route.ts`: a variável `priceId` era declarada duas vezes no mesmo escopo dentro de `applySubscriptionState`. Agora existe uma única declaração, reutilizada na identificação do plano e no histórico da assinatura.

Validação realizada: inspeção do arquivo corrigido e integridade do ZIP. A compilação `next build` precisa ser executada no ambiente de deploy para confirmar a build completa.
