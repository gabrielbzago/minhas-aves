# Publicação da página institucional para verificação do Google — Apollo 0.5.4

## O que foi ajustado no código

- A rota `/` agora é explicitamente estática (`force-static`).
- A página inicial não depende mais de `SUPABASE_SERVICE_ROLE_KEY`, consulta ao Supabase ou sessão autenticada para renderizar.
- A seção de parceiros da home foi transformada em conteúdo institucional estático. Isso evita que uma falha no banco de dados impeça o Google de ler a página inicial.
- O domínio canônico foi alinhado para `https://minhasaves.com.br`.
- Foram adicionados `robots.txt` e `sitemap.xml` com as páginas institucionais públicas.
- O `proxy.ts` continua protegendo somente `/dashboard/*` e `/auth/confirm`; não deve bloquear `/`, `/politica-privacidade`, `/termos`, `/cancelamento`, `/excluir-conta` ou `/veterinario`.

## Depois de publicar na Vercel

1. Faça deploy da versão 0.5.4 na produção.
2. Abra uma janela anônima, sem estar logado, e teste `https://minhasaves.com.br`.
3. Confirme que a página institucional aparece diretamente, sem tela de login, senha, challenge ou redirecionamento.
4. Teste também:
   - `https://minhasaves.com.br/politica-privacidade`
   - `https://minhasaves.com.br/termos`
   - `https://minhasaves.com.br/cancelamento`
   - `https://minhasaves.com.br/excluir-conta`
   - `https://minhasaves.com.br/robots.txt`
   - `https://minhasaves.com.br/sitemap.xml`
5. No painel Vercel, confira **Settings → Deployment Protection**. Se Vercel Authentication ou proteção por senha estiver habilitada para Production, desative para o deployment de produção. Não é necessário desativar proteção de previews se ela não afetar o domínio de produção.
6. Confirme em **Settings → Domains** que `minhasaves.com.br` está associado ao projeto correto e ao deployment de produção.
7. No Google Search Console, inspecione a URL `https://minhasaves.com.br` e solicite indexação depois de confirmar que o teste público funciona.
8. Só então retorne ao processo de Brand Verification do Google e escolha **Corrigi os problemas**.

## Segurança

A página institucional e os documentos legais são públicos por desenho. O conteúdo privado continua dentro de `/dashboard/*`, que permanece protegido pela sessão Supabase no `proxy.ts` e pelo layout do dashboard. Não remova as verificações de autenticação do dashboard.

## Diagnóstico se o Google ainda enxergar login

Se uma janela anônima também mostrar uma tela de login, o bloqueio está fora desta página React/Next.js (por exemplo, Vercel Deployment Protection, regra de domínio, proxy/CDN ou deployment antigo). Confira a URL final após redirecionamentos e o deployment associado ao domínio. O código não consegue remover uma proteção aplicada pela infraestrutura antes de a requisição chegar ao Next.js.
