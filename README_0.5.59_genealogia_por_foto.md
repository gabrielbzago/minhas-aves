# Apollo 0.5.59 — Genealogia por foto com IA

## Funcionalidade
- Na criação de uma ave, há duas ações independentes: dados da ave por foto e genealogia por foto.
- A leitura genealógica identifica somente pai e mãe diretos da ave principal; não confunde avós, bisavós ou trisavós com os pais.
- O backend consulta o plantel ativo do próprio criatório (RLS Supabase) e tenta localizar os pais por nome e/ou anilha.
- O vínculo só é feito quando existe uma única correspondência exata e o sexo cadastrado confere: pai macho, mãe fêmea.
- Se não estiver cadastrado, estiver ilegível ou houver mais de uma correspondência, o vínculo fica vazio e o formulário informa o motivo.
- Não cria aves, não cria parentes fictícios e não salva automaticamente. O criador confere os campos e salva o cadastro normalmente.
- A genealogia dos ancestrais acima dos pais será exibida pela árvore existente a partir dos vínculos já cadastrados.

## Planos e consumo
- Disponível nos planos Profissional e Lenda (mesma regra de acesso do Cadastro Inteligente por Foto).
- Cada leitura genealógica consome uma leitura do limite mensal já existente: Profissional 30; Lenda 100.
- Usa a variável OPENAI_API_KEY e o modelo OPENAI_BIRD_VISION_MODEL já configurados.

## Banco e implantação
- Nenhuma alteração no banco de dados.
- Nenhuma migration SQL.
- Nenhuma variável de ambiente nova.
- Publicar o ZIP e fazer deploy na Vercel.
