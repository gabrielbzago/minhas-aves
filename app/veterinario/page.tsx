import Link from "next/link";
import {createAdminClient} from "@/lib/supabase/admin";

const KAIQUE_BIO = `Meu nome é Kaique Pedro, tenho 31 anos e sou médico-veterinário, formado em 2025. Também sou formado em Logística e atualmente sou proprietário da Clínica Veterinária Vivaz, em Espírito Santo do Pinhal – SP, onde atuo no atendimento clínico de animais de pequeno porte e, principalmente, na medicina de aves.

Minha trajetória com as aves começou muito antes da minha formação acadêmica. Sou criador de aves desde os oito anos de idade, com experiência especialmente na criação de passeriformes, tendo como principais espécies o coleiro e o trinca-ferro. Essa vivência prática despertou meu interesse pela medicina aviária e contribuiu diretamente para minha escolha profissional.

Ao longo da minha formação, busquei aprimorar meus conhecimentos por meio de cursos voltados à clínica médica, manejo, clínica cirúrgica e, mais recentemente, anestesiologia veterinária voltada para aves.

Em relação à experiência prática, realizei um estágio de três meses no Criatório Veneno, onde tive a oportunidade de aprofundar meus conhecimentos na criação e no manejo de passeriformes. Posteriormente, retornei ao criatório para atuar diretamente no acompanhamento da reprodução de coleiros e na rotina de clínica médica.

Durante esse período, participei de atividades relacionadas ao controle sanitário do plantel, manejo produtivo, acompanhamento reprodutivo, ajustes nutricionais e atendimento clínico das aves.

Acredito que a combinação entre vivência na criação, conhecimento técnico e formação veterinária é um diferencial importante na minha atuação, especialmente na medicina de aves.`;

const KAIQUE_SPECIALTIES = "Medicina de aves; clínica médica de pequenos animais; manejo e clínica de passeriformes; acompanhamento reprodutivo; clínica cirúrgica; anestesiologia veterinária voltada para aves";

export const dynamic = "force-dynamic";

export default async function VeterinarioPage() {
  let vet: any = null;
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("vet_profiles")
      .select("*")
      .eq("display_name", "Kaique Pedro")
      .eq("is_active", true)
      .maybeSingle();
    vet = data;
  } catch {
    vet = null;
  }

  const name = vet?.display_name || "Kaique Pedro";
  const photo = vet?.photo_url || "/veterinarios/kaique-pedro.png";
  const bio = vet?.bio && vet.bio.trim().length > 80 ? vet.bio : KAIQUE_BIO;
  const specialties = vet?.specialties || KAIQUE_SPECIALTIES;
  const city = vet?.city || "Espírito Santo do Pinhal";
  const state = vet?.state || "SP";
  const address = vet?.address || "Coronel Antônio Augusto, 348, Centro";
  const online = vet?.online_available ?? true;
  const inPerson = vet?.in_person_available ?? true;

  return (
    <main className="public-page">
      <header className="site-header">
        <div className="container header-inner">
          <Link href="/" className="brand">
            <img className="apollo-public-logo" src="/branding/apollo-logo.png" alt="Apollo — Gestão de Aves" />
          </Link>
          <div className="actions" style={{ margin: 0 }}>
            <Link className="btn btn-ghost" href="/login">Entrar</Link>
            <Link className="btn btn-primary" href="/cadastro">Criar conta</Link>
          </div>
        </div>
      </header>

      <section className="section">
        <div className="container narrow">
          <span className="kicker">Veterinário parceiro</span>
          <h1>Medicina veterinária com experiência prática e dedicação especial às aves.</h1>
          <p className="vet-public-intro">
            Conheça o profissional parceiro do Minhas Aves Apollo e sua trajetória na clínica veterinária e na medicina de aves.
          </p>

          <article className="vet-public-profile">
            <div className="vet-public-hero">
              <img src={photo} alt={`Foto profissional de ${name}`} className="vet-public-photo" />
              <div className="vet-public-heading">
                <span className="vet-public-label">Médico-veterinário parceiro</span>
                <h2>{name}</h2>
                {vet?.crmv && <p><b>CRMV:</b> {vet.crmv}</p>}
                <p className="vet-public-clinic">Clínica Veterinária Vivaz · {city}/{state}</p>
                <div className="vet-public-tags">
                  <span>Medicina de aves</span>
                  <span>Passeriformes</span>
                  <span>Clínica de pequenos animais</span>
                </div>
              </div>
            </div>

            <section className="vet-public-section">
              <h2>Sobre Kaique Pedro</h2>
              <div className="vet-public-bio">{bio.split(/\n\s*\n/).map((paragraph: string, index: number) => <p key={index}>{paragraph}</p>)}</div>
            </section>

            <section className="vet-public-section">
              <h2>Áreas de atuação e aperfeiçoamento</h2>
              <p>{specialties}</p>
              <div className="vet-public-highlights">
                <div><strong>Desde os 8 anos</strong><span>Vivência na criação de aves, especialmente coleiros e trinca-ferros.</span></div>
                <div><strong>Criatório Veneno</strong><span>Estágio de três meses e atuação posterior no manejo, reprodução e clínica de passeriformes.</span></div>
                <div><strong>Formação contínua</strong><span>Cursos em clínica médica, manejo, clínica cirúrgica e anestesiologia veterinária de aves.</span></div>
              </div>
            </section>

            <section className="vet-public-section vet-public-contact">
              <h2>Clínica Veterinária Vivaz</h2>
              <div className="vet-public-contact-grid">
                <div><b>Atendimento</b><span>{inPerson ? "Presencial" : ""}{inPerson && online ? " e " : ""}{online ? "Online" : ""}</span></div>
                <div><b>Endereço</b><span>{address} · {city}/{state}</span></div>
                <div><b>Agendamento</b><span>O contato e o horário são combinados diretamente com o veterinário.</span></div>
              </div>
            </section>
          </article>

          <div className="card partnership-card">
            <h2>Como funciona a consulta inclusa</h2>
            <ul>
              <li>O <b>Criador Lenda</b> tem direito a <b>1 consulta para 1 ave por período anual pago</b>.</li>
              <li>O período começa na data de início da assinatura e termina na data de renovação anual registrada pelo sistema.</li>
              <li>Na renovação, uma nova consulta para uma ave é liberada para o novo período, enquanto a assinatura Lenda permanecer ativa.</li>
              <li>A consulta pode ser online ou presencial, conforme disponibilidade e acordo com o veterinário.</li>
              <li>As demais aves, novas consultas e atendimentos relacionados à mesma ave são contratados e pagos à parte diretamente com o veterinário.</li>
              <li>A plataforma apenas organiza o benefício e o histórico. Diagnóstico, prescrição e tratamento são responsabilidade do médico-veterinário.</li>
            </ul>
          </div>

          {vet?.partnership_terms && <div className="card"><h2>Termos da parceria</h2><p style={{ whiteSpace: "pre-wrap" }}>{vet.partnership_terms}</p></div>}
          <div className="actions">
            <Link href="/cadastro" className="btn btn-primary">Criar minha conta</Link>
            <Link href="/dashboard/veterinario/agendar" className="btn btn-soft">Agendar atendimento</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
