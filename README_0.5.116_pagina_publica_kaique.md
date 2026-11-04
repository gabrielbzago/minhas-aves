# Apollo 0.5.116 — página pública do veterinário

## Correção
A rota `/veterinario` agora apresenta o perfil completo do Kaique Pedro, com:
- fotografia profissional já incluída em `public/veterinarios/kaique-pedro.png`;
- biografia completa fornecida pelo usuário;
- formação, experiência prática e áreas de atuação;
- destaques sobre criação de passeriformes e experiência no Criatório Veneno;
- dados da Clínica Veterinária Vivaz e modalidades de atendimento.

A consulta ao banco busca explicitamente o perfil ativo `Kaique Pedro`, em vez de selecionar arbitrariamente o primeiro veterinário ativo. Caso a biografia ainda não tenha sido salva no Supabase, a página usa o texto fornecido como fallback público. Quando o perfil for editado no painel, os dados salvos no banco prevalecem.

## Instalação
Substitua o projeto pela versão deste pacote e faça o deploy normalmente. Não há nova migração SQL obrigatória para esta correção; a migração 0.5.115 continua sendo usada para salvar os dados no perfil.
