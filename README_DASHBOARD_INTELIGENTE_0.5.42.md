# Apollo 0.5.42 — Dashboard inteligente

## Alterações
- Mantida a distribuição do plantel por sexo da versão 0.5.41.
- Adicionado o painel “Hoje no seu criatório”, aproveitando os eventos reais do calendário e a mesma janela de alertas inteligentes já usada no calendário: nascimento no 11º ao 13º dia de choco e anilhamento do 3º ao 7º dia após o nascimento.
- Adicionados indicadores de posturas, nascimentos, ovos e filhotes com base nos eventos registrados.
- Adicionada distribuição por espécies, estoque de anilhas disponíveis e resumo veterinário.
- Layout responsivo para desktop e celular.

## Observações
- Os indicadores reprodutivos contam registros do calendário e não representam taxa de fertilidade ou sobrevivência.
- Os alertas são calculados na renderização do dashboard; não foi implementado envio Push.
- Não houve alteração de schema ou migração SQL.
- Build de produção não executado neste ambiente. Validar `npm install` e `npm run build` antes de publicar.
