# Apollo 0.5.57 — Cadastro Inteligente por Foto

## Recurso
- Leitura de plaquinha de identificação por visão computacional OpenAI.
- Disponível somente nos planos Profissional e Lenda (owner/veterinário também têm acesso).
- Preenche o formulário existente; não salva automaticamente.
- O usuário revisa e confirma os dados antes do cadastro.
- Campos ilegíveis permanecem vazios ou como indeterminados.
- O catálogo ativo de espécies do próprio criatório é usado para tentar identificar `species_id`.
- Imagem é redimensionada no navegador (máximo 1800 px) e convertida para JPEG antes do envio; não é armazenada no Apollo.
- Limite mensal: Profissional 30 leituras; Lenda 100 leituras.
- Modelo padrão: `gpt-4.1-mini`; pode ser alterado por `OPENAI_BIRD_VISION_MODEL`.

## Configuração obrigatória na Vercel
Em Project → Settings → Environment Variables, adicionar:
- `OPENAI_API_KEY` = sua chave secreta da OpenAI (somente servidor; nunca usar NEXT_PUBLIC_).
Opcional:
- `OPENAI_BIRD_VISION_MODEL` = `gpt-4.1-mini`

Depois, fazer novo Deploy. Não coloque a chave no código, no GitHub ou no navegador.

## Supabase
Executar uma vez:
`supabase/migration_cadastro_inteligente_ia_0_5_57.sql`

A migration cria somente a tabela de controle de uso mensal, com RLS por usuário.

## Fluxo de uso
1. Plano Profissional ou Lenda → Plantel → Nova ave.
2. Escolher “Preencher por foto”.
3. Fotografar ou selecionar a plaquinha.
4. Conferir e corrigir o formulário preenchido.
5. Salvar ave normalmente.

## Observações
- A IA não confirma autenticidade de documentos nem valida procedência legal.
- Datas e números são extraídos somente quando legíveis; conferir especialmente nascimento e anilha.
- A chamada é cobrada pela OpenAI conforme uso do modelo. Os limites mensais no Apollo ajudam a controlar o custo.
