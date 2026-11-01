# Apollo 0.5.61 — Plano Grátis estratégico para IA

## Objetivo
Manter o plano Grátis como porta de entrada e permitir que o usuário experimente o Cadastro Inteligente por Foto, com limites claros e convite contextual para upgrade.

## Regras implementadas
- Grátis: 1 análise de plaquinha por mês, usando somente uma foto da frente.
- Grátis: cadastro manual e demais recursos essenciais do plano permanecem disponíveis, sem alteração dos limites de aves já existentes.
- Grátis: foto do verso e genealogia por foto ficam reservadas aos planos pagos.
- Ao tentar uma segunda análise no mesmo mês, a API bloqueia a chamada e retorna mensagem de upgrade para o Profissional, destacando até 30 análises mensais, frente e verso e genealogia por foto.
- A tela do cadastro mostra a experiência gratuita e, após o limite, um convite com link para /dashboard/assinatura.
- Profissional: até 30 análises por mês; Lenda: até 100 análises por mês. Ambos mantêm análise de frente/verso e genealogia por foto.
- Cada análise concluída consome uma unidade mensal, independentemente de usar uma ou duas imagens nos planos pagos.
- Owner e veterinário mantêm a isenção de limite já existente.

## Banco e configuração
Nenhuma migration SQL ou variável de ambiente nova. Reutiliza `ai_bird_scan_usage`, `OPENAI_API_KEY` e `OPENAI_BIRD_VISION_MODEL` já existentes.

## Arquivos alterados
- `lib/plans.ts` — benefício gratuito e descrição de cotas pagas.
- `app/dashboard/plantel/novo/page.tsx` — libera a experiência Free e informa o nível do plano ao formulário.
- `components/bird-form.tsx` — interface Free com uma foto, sem verso/genealogia e CTA de upgrade após o limite.
- `app/api/ai/parse-bird-label/route.ts` — validação server-side do limite mensal e restrições do Free.
- `package.json` — versão 0.5.61.

## Observação
O limite é aplicado no servidor; ocultar controles na interface não é a única proteção. O contador mensal reaproveita a tabela existente e considera o mês UTC, conforme a implementação anterior.
