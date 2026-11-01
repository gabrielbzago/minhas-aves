# Apollo 0.5.67 — Upgrade contextual e experiência menos intrusiva

## O que mudou
- Removido o banner comercial global do topo do painel do criador Free. O dashboard fica dedicado à gestão do criatório.
- A navegação continua identificando módulos bloqueados, mas com indicação neutra do plano necessário, sem chamadas repetitivas para upgrade.
- Na grade de Recursos, os módulos bloqueados passam a usar o rótulo discreto “Ver recurso”. A oferta completa só aparece quando a pessoa abre um módulo indisponível.
- No Cadastro Inteligente por Foto, a informação do limite gratuito foi simplificada para explicar o benefício incluído, sem convite permanente para contratar.
- A oferta contextual após atingir o limite mensal de IA foi preservada.
- Permanecem os bloqueios, cotas, permissões, regras de assinatura, checkout Stripe e funcionalidades de cada plano.
- Nenhuma alteração de banco de dados ou migration SQL.

## Validação recomendada
- Entrar com conta Free e navegar pelo dashboard: não deve haver banner comercial global.
- Abrir Recursos: módulos bloqueados continuam identificados e clicáveis.
- Abrir um módulo bloqueado: a tela de detalhes continua explicando o plano necessário e oferecendo contratação.
- Consumir a análise gratuita de IA e tentar novamente: a mensagem contextual de limite e upgrade continua disponível.
- Testar Amador, Profissional, Lenda e modo Owner para confirmar que as regras e navegação permanecem iguais.
