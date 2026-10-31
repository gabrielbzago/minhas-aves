# Apollo 0.5.37 — Gestão de Anilhas

## O que foi implementado
- Cadastro individual de cada número de anilha, com unicidade e validação contra anilhas já aplicadas no plantel.
- Espécie, pai, mãe e observações no registro de estoque.
- Indicadores de total cadastrado, disponíveis, aplicados e sexo indefinido.
- Aplicação de anilha criando o filhote diretamente no plantel ou vinculando uma ave sem anilha já cadastrada.
- Baixa automática do estoque na mesma transação do vínculo/criação.
- Sexo inicial `indeterminado`, com possibilidade de definir ou corrigir depois; a alteração também atualiza o sexo da ave no plantel.
- Histórico de status e vínculo da anilha com o filhote.

## SQL obrigatório
No Supabase, abra SQL Editor e execute o arquivo `supabase/migration_gestao_anilhas_0_5_37.sql` uma única vez.

## Uso
1. Abra Recursos > Gestão de Anilhas.
2. Cadastre cada número individualmente, escolhendo espécie e, se souber, pai e mãe.
3. Na seção Aplicar anilha em filhote, escolha uma anilha disponível.
4. Escolha cadastrar um novo filhote (o sistema cria a ave no plantel) ou vincular uma ave já cadastrada sem anilha.
5. Deixe o sexo como Indefinido se ainda não souber. Você poderá alterá-lo posteriormente na própria lista de anilhas; o cadastro da ave será sincronizado.

A atualização preserva o fluxo existente de autenticação, perfil, assinatura e os demais módulos.
