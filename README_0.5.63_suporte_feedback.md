# Apollo 0.5.63 — Central de ajuda, suporte por nível e feedback

## Novidades
- Widget flutuante de Ajuda e suporte no painel do criador.
- FAQ inicial com dúvidas sobre cadastro, IA, planos, anilhas e suporte.
- Contato direto por WhatsApp: +55 19 99203-6896.
- E-mail: gabrielbzago@gmail.com.
- Link para ligação telefônica.
- Identificação de nível de atendimento conforme plano: Free padrão, Amador prioritário, Profissional prioritário e Lenda VIP prioritário.
- Formulário de avaliação com nota de 1 a 5 estrelas, categoria e sugestão/relato.
- Feedback armazenado em `public.product_feedback`, com plano e prioridade registrados no envio.

## Migração obrigatória
Execute `migration_feedback_suporte_apollo_0_5_63.sql` no SQL Editor do Supabase antes de testar o envio de avaliações. O widget de FAQ e os links de contato funcionam sem a tabela, mas o formulário depende dela.

## Observações
- O nível de prioridade é registrado para triagem da equipe; não há promessa automática de SLA nem sistema de tickets em tempo real.
- As respostas do FAQ são orientações estáticas iniciais, não um agente de IA.
- As avaliações ficam disponíveis na tabela `product_feedback` no Supabase. RLS permite que o usuário insira e consulte apenas seus próprios registros. A equipe administradora deve consultar por acesso administrativo seguro.
