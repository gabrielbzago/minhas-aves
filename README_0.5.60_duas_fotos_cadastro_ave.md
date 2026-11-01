# Apollo 0.5.60 — Cadastro inteligente com frente e verso da plaquinha

## Alterações
- No cadastro de nova ave, o usuário pode selecionar/fotografar a frente da plaquinha e, opcionalmente, o verso.
- Incluído botão separado para adicionar a foto do verso e ação explícita "Analisar fotos".
- A IA recebe as duas imagens na mesma solicitação e combina as informações complementares antes de preencher o formulário.
- A foto do verso pode ser removida antes da análise.
- Uma foto continua sendo suficiente; o verso é opcional.
- Cada foto é otimizada no navegador para JPEG, até 1800 px e até 3 MB.
- O backend aceita uma ou duas imagens, valida o tamanho agregado (máximo 5 MB) e envia ambas à OpenAI com detalhe alto.
- Uma análise com duas fotos consome somente uma leitura do limite mensal, pois é uma única solicitação à IA.
- A genealogia por foto permanece inalterada e continua aceitando uma imagem.

## Implantação
- Nenhuma migration SQL.
- Nenhuma variável de ambiente nova.
- Manter OPENAI_API_KEY e OPENAI_BIRD_VISION_MODEL existentes.
- Atualizar o projeto e publicar novo deploy na Vercel.
