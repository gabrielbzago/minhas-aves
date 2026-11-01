# Apollo 0.5.58 — Melhor leitura inteligente de plaquinhas

## O que mudou
- Melhorado o prompt de visão para classificar informações mesmo quando a placa não traz rótulos explícitos.
- Maior atenção a códigos de anilha brasileiros, incluindo IBAMA/SISPASS, diâmetro do aro (ex.: 2.2), UF/código regional (ex.: MG/A), trechos de data e sequência numérica final.
- Orientação para preservar o código completo da anilha, sem remover prefixos, pontos, barras ou números.
- Distingue anilha de registro oficial do criador; não duplica o mesmo código nos dois campos.
- Reconhece datas brasileiras quando completas e não inventa ano para datas parciais.
- Fallback conservador no servidor: se o campo de anilha vier vazio e o campo de registro contiver um padrão forte de anilha, transfere o código para anilha.

## Configuração
- Nenhuma alteração no Supabase.
- Nenhuma nova variável de ambiente.
- Reutiliza OPENAI_API_KEY e OPENAI_BIRD_VISION_MODEL já configuradas.
- Mantém os limites mensais atuais: Profissional 30 e Lenda 100.
- A imagem continua sem ser armazenada no Apollo.
