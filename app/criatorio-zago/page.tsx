import Link from "next/link";

const highlights = [
  ["🐦", "Coleiro e papa-capim", "Conteúdo voltado à criação, manejo e conhecimento das espécies."],
  ["📚", "Educação do criador", "Informação prática para quem está começando e para quem quer evoluir seu criatório."],
  ["🧬", "Reprodução responsável", "Incentivo à reprodução legalizada, organizada e com responsabilidade."],
  ["▶️", "Mais de 11 mil inscritos", "Uma comunidade construída em torno de conteúdo e experiência compartilhada."],
];

export default function CriatorioZagoPage() {
  return (
    <main className="creator-page">
      <header className="creator-page-header">
        <div className="container creator-header-inner">
          <Link href="/" className="creator-back">← Voltar ao Minhas Aves</Link>
          <span className="creator-header-badge">Criatório parceiro</span>
        </div>
      </header>
      <section className="creator-hero">
        <div className="container creator-hero-grid">
          <div className="creator-hero-copy">
            <span className="kicker">CRIATÓRIO ZAGO · DESDE 2024</span>
            <h1>Conhecimento que ajuda criadores a transformar paixão em criação responsável.</h1>
            <p className="creator-lead">O <strong>Criatório Zago</strong> é dedicado à criação de coleiro e papa-capim desde 2024, compartilhando conhecimento e experiência para ajudar criadores a iniciarem sua jornada na reprodução legalizada.</p>
            <div className="creator-actions">
              <a className="btn btn-primary" href="https://www.youtube.com/@criatoriozago" target="_blank" rel="noreferrer">▶ Conhecer o canal no YouTube</a>
              <Link className="btn btn-soft" href="/cadastro">Conhecer o Minhas Aves</Link>
            </div>
            <div className="creator-proof-row">
              <div><strong>11 mil+</strong><span>inscritos no YouTube</span></div>
              <div><strong>2024</strong><span>início do criatório</span></div>
              <div><strong>100%</strong><span>foco em conhecimento</span></div>
            </div>
          </div>
          <div className="creator-logo-panel">
            <div className="creator-logo-glow" />
            <img src="/creators/criatorio-zago.jpg" alt="Logo do Criatório Zago" className="creator-logo-large" />
            <div className="creator-logo-caption"><strong>Criatório Zago</strong><span>Coleiro · Papa-capim · Reprodução responsável</span></div>
          </div>
        </div>
      </section>
      <section className="section creator-story">
        <div className="container creator-story-grid">
          <div><span className="kicker">UMA HISTÓRIA DE CRIAÇÃO</span><h2>Mais do que criar aves: compartilhar conhecimento.</h2></div>
          <div>
            <p>Desde 2024, o Criatório Zago vem construindo uma comunidade em torno do coleiro e do papa-capim. O objetivo é aproximar informação, experiência e organização de quem deseja começar ou evoluir na criação.</p>
            <p>Por meio do YouTube, o criatório compartilha conteúdo para tornar esse caminho mais claro, incentivando criadores a buscar uma criação consciente e dentro das regras aplicáveis à atividade.</p>
          </div>
        </div>
      </section>
      <section className="section alt">
        <div className="container">
          <div className="section-head"><span className="kicker">O QUE MOVE O CRIATÓRIO</span><h2>Conhecimento, organização e responsabilidade.</h2><p>Quatro pilares que representam a proposta do Criatório Zago para a comunidade de criadores.</p></div>
          <div className="creator-highlight-grid">{highlights.map(([icon,title,text]) => <article className="creator-highlight" key={title}><div className="creator-highlight-icon">{icon}</div><h3>{title}</h3><p>{text}</p></article>)}</div>
        </div>
      </section>
      <section className="section creator-community">
        <div className="container">
          <div className="creator-community-card">
            <div>
              <span className="kicker">UMA COMUNIDADE EM CRESCIMENTO</span>
              <h2>Já somos mais de 11 mil inscritos.</h2>
              <p>O canal nasceu para compartilhar experiências e ajudar mais pessoas a entenderem o universo do coleiro e do papa-capim. Se você está começando, quer aprender sobre reprodução ou simplesmente gosta dessas aves, o Criatório Zago é um ponto de encontro para essa comunidade.</p>
              <a className="btn btn-primary" href="https://www.youtube.com/@criatoriozago" target="_blank" rel="noreferrer">Visitar @criatoriozago no YouTube →</a>
            </div>
            <div className="creator-youtube-card"><span>CANAL NO YOUTUBE</span><strong>@criatoriozago</strong><small>Conteúdo sobre coleiro, papa-capim e criação responsável.</small><a href="https://www.youtube.com/@criatoriozago" target="_blank" rel="noreferrer">Abrir canal</a></div>
          </div>
        </div>
      </section>
      <section className="section creator-platform">
        <div className="container creator-platform-inner">
          <div><span className="kicker">ORGANIZAÇÃO DO CRIATÓRIO</span><h2>Do conhecimento à gestão.</h2><p>O Minhas Aves nasce para complementar esse movimento: transformar informações do plantel em um histórico organizado, com aves, anilhas, genealogia, documentos e acompanhamento veterinário em um só lugar.</p></div>
          <Link className="btn btn-primary" href="/cadastro">Começar grátis</Link>
        </div>
      </section>
      <footer className="footer creator-footer"><div className="container"><strong>Criatório Zago</strong> · Criatório dedicado à criação de coleiro e papa-capim desde 2024.</div></footer>
    </main>
  );
}
