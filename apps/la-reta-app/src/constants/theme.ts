/**
 * Tokens de la app: un único tema, claro y editorial.
 *
 * La identidad la define la web y aquí se traduce, no se reinventa. Los hex de
 * `accent`, `ink`, `inkMuted` y `line` son la conversión exacta de los tokens
 * `oklch` de apps/la-reta-web/app/globals.css — el mismo color, no una
 * aproximación de memoria.
 *
 * Dos decisiones sostienen el resto:
 *  - **Fondo hueso, no blanco.** Las tarjetas son blancas; sin un papel algo
 *    más cálido detrás no tendrían contra qué recortarse y todo se aplanaría.
 *  - **Un solo acento.** El verde marca la acción y el dato que manda; en
 *    cuanto se usa para decorar deja de significar nada.
 */

import { Platform, type TextStyle } from "react-native";

export const Palette = {
  paper: "#FAFAF8",
  surface: "#FFFFFF",
  /** Un tono hundido, para zonas de detalle dentro de una tarjeta blanca. */
  surfaceSunken: "#F4F4F5",

  ink: "#09090B",
  inkMuted: "#71717B",
  inkFaint: "#A1A1AA",

  line: "#E4E4E7",
  /** Filete casi invisible: separa sin dibujar una reja. */
  hairline: "rgba(9, 9, 11, 0.07)",

  accent: "#007A55",
  accentInk: "#ECFDF5",
  accentSoft: "#E8F4EF",
  accentLine: "rgba(0, 122, 85, 0.22)",

  danger: "#E7000B",
  dangerInk: "#FFF1F2",

  /**
   * El ámbar de las estrellas y de la casaca: `amber-400`/`amber-700` de la
   * misma paleta que usa la web.
   *
   * Es la única excepción a la regla de un solo acento, y tiene motivo: una
   * estrella de valoración es amarilla en todas partes desde antes de que esta
   * app existiera, y pintarla de verde no la haría de la casa, la haría
   * ilegible como estrella. Fuera de las estrellas y las casacas manda el verde.
   */
  star: "#FBBF24",
  starLine: "#E4E4E7",
  amber: "#B45309",
  amberSoft: "rgba(180, 83, 9, 0.12)",
} as const;

export type Tone = keyof typeof Tones;

export const Tones = {
  ink: Palette.ink,
  muted: Palette.inkMuted,
  faint: Palette.inkFaint,
  accent: Palette.accent,
  onAccent: Palette.accentInk,
  danger: Palette.danger,
  onDanger: Palette.dangerInk,
} as const;

/**
 * Oswald es la cara condensada que la web reserva para marcadores y titulares
 * de jornada. Se carga en el arranque (ver `useAppFonts`) y por eso la capa de
 * bienvenida tiene una razón real para existir: cubre esa espera.
 */
export const Display = {
  regular: "Oswald_400Regular",
  medium: "Oswald_500Medium",
  bold: "Oswald_700Bold",
} as const;

export const Fonts = Platform.select({
  ios: { sans: "system-ui", mono: "ui-monospace" },
  default: { sans: "normal", mono: "monospace" },
  web: { sans: "var(--font-display)", mono: "var(--font-mono)" },
});

/**
 * Escala tipográfica. Las cifras van siempre en Oswald con `tabular-nums`:
 * un marcador que baila de ancho al cambiar de número se lee como un bug.
 *
 * El interlineado de Oswald tiene un mínimo: **1.2 em**. Su caja natural mide
 * 1.48 em (ascendente 1.193 + descendente 0.289 sobre 1000 upem) y iOS centra
 * el glifo dentro de la caja de línea, así que con menos recorta por arriba y
 * lo primero que se pierde es la tilde de la Ñ — "TOÑO" se dibujaba "TONO".
 *
 * No hay máximo. Llegué a documentar aquí un techo de ~52 pt porque el titular
 * de portada salía en la cara del sistema con `lineHeight: 56`; era falso. La
 * causa real era que ese texto se montaba antes de que la fuente terminara de
 * cargar, y una vista de texto nativa fija su familia al crearse. Desde que el
 * layout raíz espera a `fontsReady`, el banner de Inicio dibuja 72 pt en Oswald
 * sin problema. Si vuelve a aparecer texto en la cara equivocada, sospecha del
 * orden de montaje, no del tamaño.
 */
export const Type = {
  /** Titular de portada. Versales, muy apretado. */
  hero: {
    fontFamily: Display.bold,
    fontSize: 46,
    lineHeight: 56,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  display: {
    fontFamily: Display.bold,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  /** Cifra grande: OVR, marcador, totales. */
  stat: {
    fontFamily: Display.bold,
    fontSize: 30,
    lineHeight: 36,
    fontVariant: ["tabular-nums"],
  },
  statSmall: {
    fontFamily: Display.medium,
    fontSize: 19,
    lineHeight: 24,
    fontVariant: ["tabular-nums"],
  },
  /** Antetítulo: versalitas espaciadas sobre cada bloque. */
  eyebrow: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 22,
    lineHeight: 27,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  heading: { fontSize: 17, lineHeight: 22, fontWeight: "700" },
  body: { fontSize: 16, lineHeight: 24, fontWeight: "400" },
  bodyStrong: { fontSize: 16, lineHeight: 24, fontWeight: "600" },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: "500" },
  mono: { fontFamily: Fonts?.mono, fontSize: 12, lineHeight: 18 },
} satisfies Record<string, TextStyle>;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

/** Sombras suaves: la profundidad la da el filete, no el humo. */
export const Shadow = {
  card: "0 1px 2px rgba(9, 9, 11, 0.04), 0 8px 24px rgba(9, 9, 11, 0.05)",
  raised: "0 2px 4px rgba(9, 9, 11, 0.06), 0 12px 32px rgba(9, 9, 11, 0.09)",
  accent: "0 2px 8px rgba(0, 122, 85, 0.25)",
} as const;

/** Nada por encima de ~450 ms: más allá se siente lento, no elegante. */
export const Motion = {
  press: 120,
  quick: 220,
  base: 320,
  slow: 450,
} as const;

/**
 * Hueco que la tab bar flotante come por abajo. En iOS 26 el glass se dibuja
 * sobre el contenido, así que sin este colchón la última fila queda debajo.
 */
export const BottomTabInset = Platform.select({ ios: 56, android: 80 }) ?? 0;

/**
 * Hueco extra que pide el accesorio de la barra —el botón de acción— sobre el
 * área segura, en puntos. Solo lo necesitan las pantallas que publican una
 * acción; las demás no dibujan accesorio y les basta `BottomTabInset`.
 */
export const AccessoryInset = 72;
export const MaxContentWidth = 720;
