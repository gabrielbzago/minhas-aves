# Apollo 0.5.115 — Owner por plano + perfil Kaique Pedro

## O que mudou
- Owner: resumo clicável de usuários por plano (Grátis, Amador, Profissional e Lenda), com listagem de nomes e status.
- Perfil veterinário: biografia profissional completa e foto de Kaique Pedro na página inicial e em `/veterinario`.
- Painel veterinário: formulário para o próprio veterinário editar nome, CRMV, foto (URL), biografia, áreas de atuação, endereço, cidade, UF, WhatsApp e modalidades de atendimento.
- Mantidos os fluxos existentes de autenticação, assinaturas, consultas e permissões.

## Aplicação
1. Faça deploy do projeto normalmente.
2. No Supabase SQL Editor, execute `supabase/migration_kaique_perfil_profissional_0_5_115.sql`.
3. O SQL atualiza o perfil existente da conta `Kaique_marques@hotmail.com`. Se a conta ainda não existir, informa no NOTICE e não cria usuário nem senha.
4. O Kaique entra com sua própria conta e encontra o editor em **Painel veterinário → Meu perfil profissional**.

## Observações
- A foto enviada foi incluída em `public/veterinarios/kaique-pedro.png`.
- O campo de foto permite URL pública ou caminho dentro de `public`.
- Contadores de planos usam dados da tabela `profiles`, excluindo Owner e veterinários. Planos pagos excluem status cancelado, suspenso, bloqueado, inativo ou expirado; Grátis conta os perfis não bloqueados.
- O Owner precisa ter a política/RLS já utilizada pelo painel atual para ler os perfis. Nenhuma política de acesso foi ampliada nesta atualização.
