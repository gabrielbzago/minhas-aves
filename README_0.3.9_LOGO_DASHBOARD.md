# v0.3.9 — Logo do criatório na visão geral

A visão geral do criador agora lê `profiles.criatorio_logo_path`, gera uma URL assinada do bucket `criatorio-brand` e exibe a logo ao lado da identidade do criatório.

- Mantém a logo privada no Supabase Storage.
- Se não houver logo ou a URL assinada não estiver disponível, mostra o marcador MC.
- Layout responsivo para desktop e celular.
- Não exige nova migration, desde que o cadastro de identidade/logo já esteja funcionando.
