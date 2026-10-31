# Apollo 0.5.53 — Correção da logo do criatório

## O que mudou
- O upload agora grava o caminho da imagem em `profiles.criatorio_logo_path` imediatamente, sem depender de um segundo clique em Salvar.
- Se o vínculo no perfil falhar, o arquivo recém-enviado é removido e a tela mostra o erro real.
- Dashboard e configurações geram URL assinada no servidor com o cliente administrativo, evitando falhas causadas pela policy de leitura do Storage.
- Configurações mostra a imagem já salva, não apenas o texto "Logo salva".
- Cartão individual e impressão em lote continuam usando o mesmo bucket privado e verificam o erro da geração da URL assinada.

## Supabase
Execute `supabase/migration_logo_criatorio_0_5_53.sql` no SQL Editor. A migration é idempotente e garante bucket, coluna e policies de acesso do criador.

## Diagnóstico para clientes que já enviaram logo
Após publicar e executar a migration, o cliente deve abrir Configurações e enviar a logo novamente se o campo estiver sem imagem. O upload passa a vinculá-la automaticamente ao perfil.
