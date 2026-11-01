# Apollo 0.5.62 — Camada centralizada de conversão

## O que mudou
- Criada `lib/conversion.ts` para centralizar mensagens comerciais, benefícios e links de checkout.
- Criado `components/plan-upgrade-banner.tsx`, aviso compacto para usuários Free exibido nas páginas do painel do criador.
- Dashboard Free recebe comunicação contextual sobre evolução do criatório e benefícios do plano Amador.
- Módulos bloqueados na página Recursos agora exibem convite para conhecer o plano; o detalhe do módulo apresenta mensagem de upgrade e CTA para checkout do plano necessário.
- Navegação lateral e menu mobile identificam módulos bloqueados e indicam o plano necessário para desbloqueio.
- No cadastro inteligente, erros de limite/upgrade passam a abrir também o convite contextual para o Profissional.
- Mantidos os limites comerciais: Free 1 análise/mês; Profissional 30; Lenda 100. O Free continua com cadastro manual e demais recursos previstos.

## Banco e configuração
- Sem migration SQL.
- Sem novas variáveis de ambiente.
- Usa os planos, regras de acesso, checkout Stripe e tabela de consumo de IA existentes.

## Validação
- Validar `npm run build` no ambiente do projeto antes de publicar.
- Testar com usuário Free: banner no painel, módulo bloqueado, primeira análise IA, tentativa após consumir a cota e CTA de upgrade.
- Testar Amador/Profissional/Lenda para confirmar que o banner Free não aparece e os módulos liberados permanecem acessíveis.
