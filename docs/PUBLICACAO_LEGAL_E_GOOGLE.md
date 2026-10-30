# Publicação das páginas legais — Minhas Aves v0.5.3

## Rotas públicas incluídas
- `/politica-privacidade` — tratamento de dados, LGPD, Google Sign-In, fornecedores, retenção e direitos.
- `/termos` — regras de uso, conteúdo do usuário, planos, pagamento, arrependimento e cancelamento.
- `/cancelamento` — procedimento de cancelamento e reembolso.
- `/excluir-conta` — instruções públicas para solicitar exclusão da conta e dados.

As quatro rotas estão ligadas no rodapé público da página inicial.

## Antes de enviar para análise do Google
1. Confirme que as páginas abrem sem login em `https://www.minhasaves.com.br/politica-privacidade`, `/termos` e `/excluir-conta`.
2. No Google Cloud Console / Google Auth Platform, informe a URL da Política de Privacidade: `https://www.minhasaves.com.br/politica-privacidade`.
3. Informe a página inicial `https://www.minhasaves.com.br` como homepage e o e-mail de suporte `gabrielbzago@gmail.com`.
4. Se o formulário de verificação solicitar URL de exclusão de conta, informe `https://www.minhasaves.com.br/excluir-conta`.
5. Mantenha o domínio verificado e os domínios/origens/redirect URI OAuth exatamente alinhados com o Supabase.
6. Solicite apenas os escopos Google estritamente necessários. Para login básico, normalmente `openid`, `email` e `profile` são suficientes; não solicite acesso a Gmail, Drive ou contatos sem funcionalidade que realmente precise disso.
7. Verifique se a tela de consentimento descreve claramente o uso de nome, e-mail e foto de perfil no cadastro/login.

## Informações que o operador precisa confirmar antes da publicação comercial
- Nome empresarial ou nome completo do controlador, conforme aplicável.
- CNPJ/CPF empresarial, se aplicável, e endereço/canal formal de atendimento que a legislação exigir.
- Se existe outro e-mail de suporte ou encarregado de dados (DPO) formalmente designado.
- Se a infraestrutura de hospedagem efetivamente usada é Vercel ou outro provedor; a Política usa a expressão genérica “infraestrutura e hospedagem”.
- Se os preços, periodicidade e regras de renovação publicados no checkout Stripe correspondem exatamente aos valores exibidos no site.

## Observações importantes
- Os textos são uma base operacional de transparência e não constituem parecer jurídico nem garantem aprovação automática pelo Google. A aprovação depende também da configuração OAuth, domínio verificado, escopos solicitados, tela de consentimento e conformidade real do produto.
- O endereço de atendimento atualmente usado no projeto é `gabrielbzago@gmail.com`, identificado nos arquivos de configuração do projeto. Confirme que ele é monitorado.
- O direito de arrependimento de 7 dias foi descrito sem excluir outros direitos legais do consumidor. Não altere essa ressalva para prometer que todo e qualquer reembolso é impossível após o sétimo dia.
- A página de exclusão fornece um canal de solicitação por e-mail; ela não implementa exclusão automática dentro do painel. Se o produto ou a plataforma Google exigir fluxo de exclusão dentro do app, implemente também uma ação autenticada e segura no produto.
