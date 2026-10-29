export type CardColorKey = "verde" | "azul" | "azul-real" | "vermelho" | "laranja" | "roxo" | "grafite" | "dourado";

export const CARD_COLORS: Record<CardColorKey, { name: string; hex: string }> = {
  verde: { name: "Verde", hex: "#43b684" },
  azul: { name: "Azul", hex: "#2f80c9" },
  "azul-real": { name: "Azul-real", hex: "#3f51b5" },
  vermelho: { name: "Vermelho", hex: "#d95757" },
  laranja: { name: "Laranja", hex: "#ed8b32" },
  roxo: { name: "Roxo", hex: "#8b5cc7" },
  grafite: { name: "Grafite", hex: "#46535c" },
  dourado: { name: "Dourado", hex: "#c59a32" },
};

export const DEFAULT_CARD_COLOR: CardColorKey = "verde";

export function isCardColorKey(value: string | null | undefined): value is CardColorKey {
  return !!value && Object.prototype.hasOwnProperty.call(CARD_COLORS, value);
}
