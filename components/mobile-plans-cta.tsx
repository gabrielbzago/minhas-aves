"use client";

import { useEffect, useState } from "react";

/** Atalho discreto para os planos na landing page mobile. */
export default function MobilePlansCta() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const plansSection = document.getElementById("planos");
    if (!plansSection || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0.05, rootMargin: "0px 0px -8% 0px" }
    );
    observer.observe(plansSection);
    return () => observer.disconnect();
  }, []);

  if (!visible) return null;

  return (
    <a className="mobile-plans-cta" href="#planos" aria-label="Ver planos e valores do Apollo">
      <span>Ver planos e valores</span>
      <span className="mobile-plans-cta-arrow" aria-hidden="true">→</span>
    </a>
  );
}
