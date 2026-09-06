"use client";

import { LazyMotion, MotionConfig } from "motion/react";
import type { ReactNode } from "react";
import { SPRING_SETTLE } from "./motion-tokens";

/**
 * El paquete de features de Motion (layout, gestos, exit) se descarga aparte del
 * bundle inicial: `m` solo trae el renderer, ~5 kB en vez de ~35 kB. Hasta que
 * llega, los elementos ya están pintados en su estado inicial.
 */
const loadMotionFeatures = () =>
  import("motion/react").then((mod) => mod.domMax);

/**
 * Config global de Motion.
 *
 * `reducedMotion="user"` hace que Motion consulte `prefers-reduced-motion` por
 * su cuenta y salte al valor final en vez de animar, así que ningún componente
 * necesita su propio `window.matchMedia`. El `@media (prefers-reduced-motion)`
 * de `globals.css` sigue cubriendo lo que es puramente CSS.
 *
 * `strict` hace que usar `motion.div` (el bundle completo) lance un error en vez
 * de pasar desapercibido: en esta app siempre se usa `m`.
 */
export const MotionProvider = ({
  children,
}: {
  readonly children: ReactNode;
}) => {
  return (
    <LazyMotion features={loadMotionFeatures} strict>
      <MotionConfig reducedMotion="user" transition={SPRING_SETTLE}>
        {children}
      </MotionConfig>
    </LazyMotion>
  );
};
