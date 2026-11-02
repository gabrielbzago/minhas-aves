"use client";

import { useEffect, useState } from "react";

/** Anima a saudação uma única vez por autenticação nesta aba. */
export default function GreetingWave({ userId }: { userId: string }) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const key = `apollo:greeting-wave:${userId}`;
    try {
      if (window.sessionStorage.getItem(key) === "1") return;
      window.sessionStorage.setItem(key, "1");
      setAnimate(true);
      const timeout = window.setTimeout(() => setAnimate(false), 1250);
      return () => window.clearTimeout(timeout);
    } catch {
      // Se o navegador bloquear sessionStorage, mantém a saudação estática.
    }
  }, [userId]);

  return (
    <span
      className={`greeting-wave${animate ? " greeting-wave--animate" : ""}`}
      role="img"
      aria-label="Olá"
    >
      👋
    </span>
  );
}
