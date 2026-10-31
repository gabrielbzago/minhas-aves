# Apollo 0.5.54 — Ajustes mobile, logo e sexagem

## Alterações
- Adicionado botão "Sair da conta" fixo no rodapé do menu lateral mobile.
- Upload da logo agora redimensiona proporcionalmente para no máximo 512 x 512 px e converte para WebP com limite de 300 KB.
- Orientação de dimensões e peso exibida no campo de logo.
- Exibição de sexo em cartões individuais, cartões em lote, placas de gaiola e certificado passa a usar "Macho" e "Fêmea" (ou "Não informado").

## Supabase
Nenhuma migration necessária. O bucket `criatorio-brand` já é usado pelo projeto.

## Observação
O upload passa a salvar no caminho estável `<user_id>/logo.webp`, substituindo a logo anterior do mesmo criador.
