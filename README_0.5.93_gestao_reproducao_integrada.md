# Apollo 0.5.93 — Gestão de Reprodução integrada

## Implementação
- A tela Recursos > Gestão de Reprodução foi substituída por um painel de ciclo reprodutivo por fêmea.
- Lê os eventos existentes em `calendar_events`; os registros já existentes aparecem no acompanhamento sem migração ou recadastro.
- Registros criados pela Gestão de Reprodução são enviados à API `/api/calendar-events`, a mesma utilizada pela tela Calendário. Assim, os eventos aparecem no calendário atual e vice-versa.
- Etapas disponíveis: gala/acasalamento (com macho), postura, nascimento e anilhamento.
- Acompanhamento por fêmea: última postura, início real do choco, previsão de nascimento, nascimento registrado e previsão de anilhamento.
- Dashboard com fêmeas do plantel, fêmeas chocando/aguardando nascimento, previsões e anilhamentos pendentes, eventos do mês e alertas.
- Parâmetros ajustáveis por espécie: duração da postura, dias de incubação, dias até anilhamento e janelas de alerta.
- As configurações são persistidas em `bird_module_records`, usando `module_code = 'reproducao'` e um marcador JSON `config_kind = 'species_config'`. Não requer tabela nova nem SQL adicional.
- O Calendário também carrega essas configurações para calcular seus lembretes inteligentes, incluindo previsões e alertas de nascimento/anilhamento; o formulário do calendário usa a duração de postura e o prazo de anilhamento configurados para a espécie.

## Observações
- Os períodos são estimativas configuráveis pelo criador; não são tratados como regras biológicas universais.
- Não foi alterada a estrutura nem apagado nenhum evento existente do calendário.
- O pacote foi verificado quanto à integridade do ZIP e os arquivos TSX alterados passaram pela verificação sintática do compilador TypeScript. O `npm run build` completo não foi executado porque a instalação das dependências excedeu o tempo disponível neste ambiente.
