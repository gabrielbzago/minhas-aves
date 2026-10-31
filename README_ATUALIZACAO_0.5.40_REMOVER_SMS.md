# Apollo 0.5.40 — Remoção temporária do módulo SMS

## Alterações
- Removido “Notificação por SMS” do catálogo de Recursos.
- Removido o formulário de cadastro de telefone/mensagem/data do gerenciador genérico de módulos.
- Removida a liberação de SMS dos planos Profissional e Lenda e dos benefícios comerciais exibidos.
- Removidos os ícones e referências visuais do SMS nos menus desktop e mobile.
- Mantidos os registros e referências legadas no banco/migrations para preservar compatibilidade com dados existentes.

## Planejamento
O módulo de SMS fica fora da versão de lançamento. Notificações Push serão avaliadas como melhoria futura, aproveitando os lembretes automáticos já existentes no calendário e sem substituir nem duplicar a centralização atual de avisos internos.

## Validação
Alterações estáticas verificadas por busca de referências no código. Build de produção não executado neste ambiente (dependências não instaladas).
