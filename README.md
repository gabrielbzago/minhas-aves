# Minhas Aves — plataforma Apollo

MVP SaaS para gestão de plantel de aves, genealogia, genética, registros e cartões de identificação.


## Marca e domínio de produção

- **Marca pública e marketing:** Minhas Aves
- **Domínio oficial:** https://www.minhasaves.com.br
- **Nome interno do software:** Apollo — Gestão de Criatórios
- A landing page, login, cadastro e SEO usam Minhas Aves. A área autenticada pode exibir o logo Apollo como identidade do sistema.

Antes de publicar, configure `NEXT_PUBLIC_APP_URL=https://www.minhasaves.com.br` no ambiente de produção, vincule o domínio na hospedagem e ajuste o Site URL/Redirect URLs no Supabase Auth. Configure também a conta Stripe própria de Minhas Aves, com seus próprios Price IDs, chaves e webhook — não reutilize os do TubeX.

O logo interno fica em `public/branding/apollo-logo.png`; o símbolo usado na marca pública e no favicon fica em `public/branding/minhas-aves-icon.png`.

## 1. Instalação

```bash
npm install
cp .env.example .env.local
npm run dev
```

Preencha `.env.local` com as credenciais do novo projeto Supabase e Stripe.

## 2. Supabase

Crie um projeto novo e execute:
`supabase/schema.sql`

Depois, configure Authentication > URL Configuration:
- Site URL: seu domínio
- Redirect URL: `https://www.minhasaves.com.br/auth/confirm`
- local: `http://localhost:3000/auth/confirm`

## 3. Stripe

Crie dois produtos recorrentes:
- Criatório Amador — R$ 149,90/ano
- Criatório Profissional — R$ 249,90/ano

Copie os Price IDs para:
`STRIPE_PRICE_AMADOR`
`STRIPE_PRICE_PROFISSIONAL`

Configure o webhook:
`https://www.minhasaves.com.br/api/stripe/webhook`

Eventos recomendados:
- checkout.session.completed
- customer.subscription.updated
- customer.subscription.deleted
- invoice.payment_failed

Coloque o signing secret em `STRIPE_WEBHOOK_SECRET`.

O webhook verifica a assinatura usando o corpo bruto da requisição.

## 4. Importação do catálogo

`supabase/seed_species.csv` é um modelo inicial. Não trate os exemplos como lista taxonômica completa. Para produção, importe uma fonte taxonômica validada e compatível com o uso comercial do projeto.

## 5. Preços comerciais de lançamento

- Grátis: até 5 aves.
- Criatório Amador: R$ 149,90/ano, plantel ilimitado.
- Criatório Profissional: R$ 249,90/ano, plantel ilimitado, com acesso aos módulos profissionais.
- Membros elegíveis do canal podem receber bônus de até 10 aves mediante validação manual.

Os valores exibidos na interface são os preços comerciais sugeridos para o lançamento. No Stripe, crie os produtos anuais com esses valores e cole os Price IDs no `.env.local`.

O limite de 5 aves do plano Grátis é protegido no banco pelo trigger `check_bird_limit`. Os planos pagos não possuem limite de quantidade de aves; a diferenciação comercial é feita pelo conjunto de funcionalidades.

## 6. Módulos e evolução do produto

- gestão de anilhas e histórico de movimentações
- edição da ficha da ave
- exclusão/arquivamento com histórico
- árvore genealógica recursiva com múltiplas gerações
- descendentes
- busca avançada
- filtros por espécie/sexo/status/genética
- galeria e upload de fotos
- documentos e anexos
- impressão em lote
- etiquetas de gaiola
- exportação CSV/PDF
- dashboard de reprodução
- acasalamentos e ninhadas
- controle de ovos e filhotes
- alertas
- aplicativo mobile

## Observação jurídica
Os textos de privacidade e termos incluídos são modelos técnicos iniciais, não parecer jurídico. Antes de vender assinaturas, revise LGPD, regras de fauna silvestre aplicáveis, política de retenção/exclusão e obrigações tributárias/consumeristas com profissional habilitado.

## 7. Bônus para membros do canal

O banco possui `profiles.bonus_birds`. Para conceder 5 aves extras a um membro elegível, deixando o plano Grátis com capacidade total de 10 aves:

```sql
update public.profiles
set bonus_birds = 5
where id = 'UUID_DO_USUARIO';
```

Para remover o benefício:

```sql
update public.profiles
set bonus_birds = 0
where id = 'UUID_DO_USUARIO';
```

Os planos pagos continuam sem limite de quantidade de aves.

## Módulo veterinário e plano Criador Lenda

O projeto inclui o plano anual **Criador Lenda — R$ 349,90/ano**, com uma consulta veterinária para uma única ave por período anual pago. Qualquer plano pode solicitar atendimento; nos demais planos o valor é combinado diretamente com o veterinário.

### Configuração do veterinário
1. Crie o usuário do veterinário no Supabase Auth.
2. Pegue o UUID e execute `update public.profiles set role='veterinarian' where id='UUID';`.
3. Cadastre uma linha em `public.vet_profiles` com nome, CRMV, foto, especialidade, endereço e WhatsApp.
4. O veterinário entra pelo mesmo `/login` e é encaminhado para `/dashboard/veterinario`.

### Owner
Defina seu usuário com `role='owner'`. O painel `/dashboard/owner` controla assinantes Lenda, consultas, repasses e patrocinadores.

### Stripe
Configure também `STRIPE_PRICE_LENDA` no `.env.local` e o webhook com os eventos de assinatura. O valor comercial inicial é R$ 349,90/ano; o repasse ao veterinário é controlado separadamente em `vet_payouts` e começa em R$ 100 por benefício/assinatura conforme o acordo do projeto.

### Documentos veterinários
A conclusão da consulta exige dois PDFs: **prontuário do paciente** e **receita**. Os arquivos ficam no bucket privado `vet-records`. O veterinário pode enviar e baixar; o criador pode baixar, mas não enviar nem alterar os PDFs.

### Patrocinadores
A página inicial mostra no máximo 5 patrocinadores ativos. A migration já cria **FM Eletrônica** com o site `https://fmeletronica.com.br`; a logo pode ser adicionada depois no campo `logo_url`.

## Checklist da atualização veterinária
- [ ] Rodar `supabase/migration_veterinario_patrocinadores_lenda.sql`.
- [ ] Criar usuário do veterinário no Auth e rodar `supabase/veterinario_setup_template.sql` preenchido.
- [ ] Definir seu próprio usuário como `owner`.
- [ ] Criar no Stripe o preço anual de R$ 349,90 e colocar `STRIPE_PRICE_LENDA`.
- [ ] Configurar webhook para assinatura, pagamento falho e dispute.
- [ ] Colocar a logo da FM Eletrônica em `public/sponsors/` e apontar `sponsors.logo_url`.


## Google OAuth

No Supabase: `Authentication > Providers > Google`, habilite o provedor e informe o Client ID/Client Secret do Google Cloud. O login e cadastro usam `signInWithOAuth({ provider: "google" })` e retornam para `/auth/confirm`.

Client ID criado para Minhas Aves: `726944452755-9msipi9b6rbkc924qc8jo4876tgk3r9r.apps.googleusercontent.com`. No Google Cloud, use como URI de redirecionamento o callback do Supabase exibido no painel:
`https://SEU-PROJETO.supabase.co/auth/v1/callback`

Depois, em Supabase `Authentication > URL Configuration`, mantenha a URL do site e as Redirect URLs permitidas, incluindo:
`http://localhost:3000/auth/confirm`
e a URL de produção equivalente.

A aplicação não armazena senha ou segredo do Google. O fluxo OAuth é tratado pelo Supabase Auth.


## Impressão e exportação

O Free pode consultar e administrar o plantel pelo celular, mas não possui recursos de impressão.
Nos planos pagos estão disponíveis:
- cartão/crachá individual da ave;
- ficha A4 completa da ave;
- impressão do plantel completo;
- impressão da árvore genealógica e descendentes;
- acesso aos PDFs veterinários da própria ave, quando disponíveis.

As rotas de impressão verificam o plano no servidor. O conteúdo é preparado em HTML de impressão para que o usuário possa imprimir ou salvar como PDF pelo diálogo do navegador.


## Owner de validação

A conta `gabrielbzago@gmail.com` é reconhecida como Owner no servidor. O painel Owner aparece pelo e-mail mesmo que o campo `role` do perfil ainda esteja `creator`; ao usar o seletor de planos pela primeira vez, o sistema confirma `role=owner` no banco.

Se alterar `.env.local`, pare e reinicie o Next.js (`Ctrl+C` e depois `npm run dev`). Não use `NEXT_PUBLIC_` para `OWNER_EMAIL`, pois ele é uma configuração exclusivamente de servidor.

## Atualização — cartão de gaiola frente e verso + CTF

- O cartão de gaiola agora é uma ficha única frente/verso.
- Frente: logo do criatório, nome da ave, proprietário, CTF opcional, nascimento, sexo, anilha, espécie e registro.
- Verso: logo do criatório novamente e árvore genealógica visual com pais e avós cadastrados, além de genética/matriz e descendentes.
- O CTF é opcional e pode ser informado no cadastro ou posteriormente em Configurações.
- A logo do criatório é reutilizada automaticamente no frente e no verso.
- Free pode visualizar o cartão; a impressão real permanece bloqueada no Free. Planos pagos podem imprimir.
- Execute `supabase/migration_ctf_cartao_frente_verso.sql` uma vez no SQL Editor do Supabase.

## Atualização 0.2.1 — cadastro de aves e erros amigáveis

- O cadastro de aves agora usa `/api/birds`, que define `user_id` exclusivamente pelo usuário autenticado. Isso corrige o erro de RLS causado pelo formulário enviar a ave sem `user_id`.
- Datas vazias são convertidas para `NULL`.
- Validações de nome, espécie, sexo, datas, status, pai/mãe e auto-vínculo são feitas antes do envio.
- Erros técnicos do Supabase não são mais exibidos diretamente na interface.
- O console continua registrando o erro técnico para diagnóstico.
- Importação CSV de aves também usa a rota segura `/api/birds`.
- Login, cadastro e solicitação veterinária também recebem mensagens amigáveis.

### Importante
A migration/RLS existente pode permanecer como está. O aplicativo passa a preencher o `user_id` no servidor com `auth.uid()`, respeitando a policy `birds_insert_own`.


## Atualização 0.2.2 — histórico veterinário
- A ficha individual da ave agora exibe cada consulta com a data formatada, status e modalidade.
- Cada consulta mostra os botões de download do prontuário e da receita quando o veterinário já anexou os PDFs.
- Quando um documento ainda não foi anexado, a ficha informa isso claramente.
- Prontuário e receita continuam sendo anexados exclusivamente pela área do veterinário/owner. O criador apenas baixa os arquivos.
- O download dos documentos veterinários não é mais bloqueado pelo plano Free; se houver consulta e documento arquivado, o criador pode baixá-lo.
- Não há nova migration obrigatória nesta atualização: a estrutura `vet_consultations`, os caminhos dos PDFs e o bucket `vet-records` já fazem parte da migration veterinária existente.

## Transferência de aves entre criadores — v0.3.0

A versão atual inclui transferência interna entre contas do Minhas Aves.

### Banco de dados

Depois de executar as migrations anteriores, execute:

```text
supabase/migration_transferencias.sql
```

A migration adiciona:

- CPF do criador (`profiles.cpf`), normalizado e único;
- solicitações de transferência com confirmação do destinatário;
- histórico/auditoria das transferências;
- registros genealógicos de ancestrais que não contam como aves do plantel;
- preservação dos descendentes do cedente quando uma ave-pai/mãe é transferida;
- transferência dos módulos e histórico veterinário vinculados à ave real;
- limite do plano do destinatário respeitado no aceite.

### Fluxo

1. O cedente cadastra o próprio CPF em **Configurações**.
2. Em **Transferências** ou na ficha da ave, escolhe uma ave ativa e informa o CPF do destinatário.
3. O sistema localiza a conta do outro criador sem revelar o CPF para terceiros.
4. O destinatário recebe a solicitação e pode **Aceitar** ou **Recusar**.
5. Ao aceitar, a ave real muda de proprietário, seus dados e histórico acompanham a ave e a genealogia dos ancestrais é reconstruída como referências genealógicas.
6. O limite gratuito do destinatário é respeitado.

### Importante sobre o SisPass / IBAMA

Esta funcionalidade é uma transferência **interna do software** entre contas do Minhas Aves. Ela não substitui a operação oficial perante o órgão ambiental. Para passeriformes sujeitos ao SisPass, o criador deve continuar realizando a transferência no sistema oficial quando aplicável.


## v0.3.2 — Anilha globalmente única

O sistema impede o cadastro/reutilização de um número de anilha já utilizado por qualquer ave real, inclusive aves arquivadas, falecidas ou transferidas. A regra é global entre criadores. Referências genealógicas preservam a anilha histórica em `reference_ring_number` sem reservar o número.

## Atualização 0.4.7 — veterinário e cabeçalho mobile

- Adicionado `supabase/cadastro_veterinario_kaique_pedro.sql` para vincular a conta criada pelo próprio veterinário ao papel profissional e cadastrar os dados da Clínica Vivaz.
- Adicionado `README_CADASTRO_VETERINARIO_KAIQUE.md` com a sequência de ativação.
- Ajustado o cabeçalho da landing page em telas pequenas para empilhar a marca e os botões, sem sobreposição entre **Entrar** e **Criar conta**.
- Não foi criada senha provisória; o veterinário define a própria senha no cadastro.


## Correção de cadastro — v0.5.3

Antes de novos cadastros, execute `supabase/migration_fix_signup_trigger.sql` no Supabase SQL Editor. Para investigar falhas, use `supabase/diagnostico_cadastro.sql`. O SQL de ativação do veterinário usa `kaique_marquess@hotmail.com` (dois “s”).
