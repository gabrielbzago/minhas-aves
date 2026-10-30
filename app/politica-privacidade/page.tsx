import Link from "next/link";

const updated = "30 de outubro de 2026";
export const metadata = {
  title: "Política de Privacidade",
  description: "Saiba como o Minhas Aves coleta, utiliza, armazena e protege seus dados pessoais.",
};

export default function PrivacyPolicy() {
  return <main className="auth-page" style={{display:"block",minHeight:"100vh",paddingBottom:48}}>
    <article className="container legal-document" style={{maxWidth:920,paddingTop:42}}>
      <Link href="/" className="btn btn-ghost">← Voltar ao Minhas Aves</Link>
      <header style={{margin:"28px 0 30px"}}><span className="kicker">TRANSPARÊNCIA E PROTEÇÃO DE DADOS</span><h1>Política de Privacidade</h1><p>Última atualização: {updated}</p><p>Esta Política explica como o Minhas Aves trata dados pessoais quando você acessa o site, cria uma conta ou utiliza as ferramentas de gestão de criatórios.</p></header>
      <h2>1. Quem é responsável pelo tratamento</h2>
      <p>O serviço Minhas Aves (também identificado como Apollo) é operado por Gabriel B. Zago, responsável pelo atendimento de privacidade por meio do e-mail <a href="mailto:gabrielbzago@gmail.com">gabrielbzago@gmail.com</a>. Para solicitações relacionadas a dados pessoais, utilize esse canal e informe o e-mail vinculado à sua conta. Não envie senhas ou códigos de autenticação.</p>
      <h2>2. Dados que podemos tratar</h2>
      <ul><li><b>Cadastro e identificação:</b> nome, endereço de e-mail, telefone, CPF quando informado, cidade, estado e nome do criatório.</li><li><b>Autenticação:</b> identificadores da conta, dados técnicos de sessão e, quando escolhido, informações básicas disponibilizadas pelo Google, como nome, e-mail e foto de perfil.</li><li><b>Dados do criatório:</b> cadastro de aves, espécies, anilhas, genealogia, reprodução, genética, fotos, documentos, gaiolas, observações e históricos inseridos pelo usuário.</li><li><b>Dados veterinários:</b> informações de agendamento e registros, prontuários ou receitas relacionados aos animais, quando inseridos pelo usuário ou profissional autorizado.</li><li><b>Assinatura e pagamento:</b> plano contratado, status, datas e identificadores da transação. Os dados de cartão são processados pelo provedor de pagamento e não devem ser inseridos nos campos do sistema.</li><li><b>Dados técnicos:</b> endereço IP, navegador, dispositivo, registros de acesso, eventos de segurança e informações necessárias ao funcionamento e diagnóstico do serviço.</li></ul>
      <h2>3. Para que usamos os dados e bases legais</h2>
      <p>Tratamos os dados para criar e proteger sua conta, autenticar o acesso, disponibilizar as funcionalidades contratadas, armazenar e apresentar os registros do criatório, processar assinaturas, prestar suporte, prevenir fraude, cumprir obrigações legais e melhorar a estabilidade do sistema. Conforme o caso, as bases legais incluem execução de contrato ou procedimentos preliminares, cumprimento de obrigação legal, exercício regular de direitos, legítimo interesse e consentimento, nos termos da Lei nº 13.709/2018 (LGPD).</p>
      <h2>4. Login com Google e dados do Google</h2>
      <p>Se você escolher “Continuar com Google”, o Google poderá compartilhar conosco os dados básicos autorizados na tela de consentimento, como nome, endereço de e-mail e foto de perfil, conforme as permissões solicitadas. Utilizamos essas informações exclusivamente para autenticar sua identidade, criar ou vincular sua conta e exibir os dados básicos do perfil. Não vendemos dados obtidos do Google, não os utilizamos para publicidade e não os compartilhamos com terceiros para finalidades independentes da operação do serviço. O uso e a transferência de informações recebidas das APIs do Google observam a Google API Services User Data Policy, incluindo os requisitos de uso limitado quando aplicáveis.</p>
      <h2>5. Compartilhamento e fornecedores</h2>
      <p>Não comercializamos dados pessoais. O compartilhamento ocorre apenas quando necessário à prestação do serviço, à segurança ou ao cumprimento da lei, incluindo:</p>
      <ul><li><b>Supabase:</b> autenticação, banco de dados e armazenamento de arquivos.</li><li><b>Google:</b> autenticação quando o usuário escolhe entrar com sua conta Google.</li><li><b>Stripe:</b> processamento de pagamentos, cobrança e gestão de assinaturas.</li><li><b>Infraestrutura e hospedagem:</b> provedores técnicos necessários para disponibilizar o site e suas funcionalidades.</li></ul>
      <p>Esses fornecedores podem tratar dados conforme suas próprias políticas e instruções contratuais. Não autorizamos o uso dos dados do criatório para finalidades alheias à prestação do Minhas Aves.</p>
      <h2>6. Cookies, armazenamento local e segurança</h2>
      <p>Utilizamos cookies e tecnologias semelhantes estritamente necessários para autenticação, manutenção de sessão, segurança e funcionamento das funcionalidades. Fornecedores de autenticação e pagamento também podem utilizar tecnologias próprias em seus fluxos. Adotamos medidas técnicas e organizacionais razoáveis, como controle de acesso, autenticação e regras de segurança do banco de dados. Nenhum sistema é totalmente livre de riscos; mantenha sua senha em sigilo e avise-nos se suspeitar de acesso indevido.</p>
      <h2>7. Armazenamento e retenção</h2>
      <p>Guardamos os dados enquanto a conta estiver ativa e pelo período necessário às finalidades descritas, à prestação do serviço, à resolução de disputas e ao cumprimento de obrigações legais ou regulatórias. Após pedido de exclusão, os dados serão eliminados ou anonimizados quando possível, ressalvadas informações que precisem ser conservadas por obrigação legal, exercício regular de direitos, prevenção a fraude ou registros financeiros. Cópias de segurança podem permanecer por período limitado até sua sobrescrita segura.</p>
      <h2>8. Seus direitos (LGPD)</h2>
      <p>Você pode solicitar confirmação do tratamento, acesso, correção, anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade, portabilidade quando aplicável, informação sobre compartilhamentos, revogação de consentimento e revisão de decisões automatizadas nos termos da lei. Para exercer seus direitos, escreva para <a href="mailto:gabrielbzago@gmail.com?subject=Privacidade%20-%20Minhas%20Aves">gabrielbzago@gmail.com</a>. Poderemos solicitar informações razoáveis para confirmar sua identidade e proteger sua conta.</p>
      <h2>9. Exclusão da conta</h2>
      <p>Você pode solicitar a exclusão da conta e dos dados associados conforme as instruções da página <Link href="/excluir-conta">Excluir conta</Link>. A exclusão pode impedir o acesso ao plantel e aos documentos. Alguns registros poderão ser mantidos pelo prazo exigido por lei ou para defesa de direitos, conforme explicado nesta Política.</p>
      <h2>10. Crianças e adolescentes</h2>
      <p>O serviço é destinado a pessoas capazes de contratar nos termos da legislação aplicável. Não buscamos coletar intencionalmente dados pessoais de crianças. Se identificar cadastro realizado indevidamente por criança, entre em contato para análise e providências.</p>
      <h2>11. Transferência internacional</h2>
      <p>Alguns fornecedores de infraestrutura podem armazenar ou processar dados em outros países. Quando isso ocorrer, adotaremos os mecanismos e salvaguardas exigidos pela legislação brasileira aplicável.</p>
      <h2>12. Alterações desta Política</h2>
      <p>Esta Política poderá ser atualizada para refletir mudanças legais, técnicas ou funcionais. A versão vigente ficará publicada nesta página, com a data da última atualização.</p>
      <h2>13. Contato</h2>
      <p>Dúvidas, solicitações ou reclamações sobre privacidade: <a href="mailto:gabrielbzago@gmail.com">gabrielbzago@gmail.com</a>.</p>
      <hr style={{border:0,borderTop:"1px solid var(--line)",margin:"32px 0"}}/><p><Link href="/termos">Termos de Uso</Link> · <Link href="/cancelamento">Cancelamento e reembolso</Link> · <Link href="/excluir-conta">Excluir conta</Link></p>
    </article>
  </main>;
}
