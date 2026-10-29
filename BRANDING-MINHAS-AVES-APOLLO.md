# Identidade de marca — Minhas Aves + Apollo

## Arquitetura de marca

- **Marca pública, domínio e marketing:** Minhas Aves
- **Domínio oficial:** https://www.minhasaves.com.br
- **Nome interno do sistema/plataforma:** Apollo
- **Assinatura do logo interno:** Apollo — Gestão de Criatórios

A landing page, SEO, páginas públicas, login e cadastro apresentam a marca **Minhas Aves**. A área autenticada do software pode apresentar o logo **Apollo**, que identifica o sistema por trás do produto. Não use o logo Apollo como logo principal da campanha pública de Minhas Aves, porque são funções de marca diferentes.

## Arquivos de marca

- `public/branding/apollo-logo.png`: logo oficial Apollo fornecido pelo usuário, aplicado na interface interna e nas telas públicas.
- `public/branding/minhas-aves-icon.png`: símbolo da ave para a marca pública Minhas Aves.
- `app/icon.png`: ícone do site/app baseado no símbolo da ave.

## Paleta de referência

- Azul-marinho: `#051627`
- Azul profundo: `#071B2E`
- Amarelo-dourado: `#FFD52F`
- Creme: `#FFF8E8`
- Verde-oliva: conforme o símbolo da ave

## Publicação

- URL pública canônica: `https://www.minhasaves.com.br`
- Variável de produção: `NEXT_PUBLIC_APP_URL=https://www.minhasaves.com.br`
- Atualize o domínio no provedor de hospedagem, DNS, Supabase Auth (Site URL e Redirect URLs) e Stripe (URLs de sucesso/cancelamento e endpoint de webhook).
