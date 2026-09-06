/**
 * Presets de movimiento compartidos.
 *
 * Los tiempos son eco de los tokens que ya viven en `app/globals.css`
 * (`--duration-exit: 150ms`, `--duration-enter: 210ms`, `--duration-move: 400ms`)
 * y la curva es la misma que usan `.card-shine` y `::view-transition-group(.morph)`.
 * Motion entra solo donde el CSS no llega: física con overshoot, enter/exit real
 * y gestos. Lo demás sigue siendo CSS.
 */

/**
cubic-bezier(0.22, 1, 0.36, 1) — la curva "expo out" del resto del sistema.
*/
export const EASE_OUT_EXPO = [0.22, 1, 0.36, 1] as const;

/**
Respuesta inmediata a hover/press: rápido y sin rebote.
*/
export const SPRING_SNAP = {
  type: "spring",
  stiffness: 520,
  damping: 32,
  mass: 0.7,
} as const;

/**
El "pop" FIFA: entra pasado de rosca y se acomoda. Para números y tokens.
*/
export const SPRING_POP = {
  type: "spring",
  stiffness: 380,
  damping: 18,
} as const;

/**
Reacomodos de layout (`layout`, `layoutId`): firme, sin oscilar.
*/
export const SPRING_SETTLE = {
  type: "spring",
  stiffness: 260,
  damping: 30,
} as const;

/**
Segundos entre hijos de un grupo escalonado.
*/
export const STAGGER = 0.06;

/**
Duración base de un fundido, en segundos (= `--duration-enter`).
*/
export const FADE_DURATION = 0.21;

/**
 * Tilt para paneles anchos (el comentarista, el ícono de la reta).
 *
 * Una carta vertical de ~120 px aguanta 11° y un salto de escala; los mismos
 * valores en un panel de ~700 px se leen como un vaivén exagerado, porque el
 * recorrido en pantalla de las esquinas crece con el ancho. Aquí el 3D es solo
 * un guiño de profundidad.
 */
export const PANEL_TILT = {
  maxTilt: 3,
  hoverScale: 1.012,
  hoverLift: 10,
  glareStrength: 0.5,
} as const;
