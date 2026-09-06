"use client";

import { m, type Variants } from "motion/react";
import type { CSSProperties, ReactNode } from "react";
import { SPRING_POP, STAGGER } from "./motion-tokens";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: STAGGER, delayChildren: 0.04 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: SPRING_POP },
};

type CommonProps = {
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly children: ReactNode;
};

/**
 * Orquesta la entrada escalonada de sus hijos `<StaggerItem>`.
 *
 * Solo recibe `children`, así que un Server Component puede envolver su árbol
 * sin volverse cliente: lo que cruza la frontera ya viene renderizado.
 */
export const StaggerGroup = ({
  as = "div",
  className,
  style,
  children,
}: CommonProps & { readonly as?: "div" | "ol" }) => {
  const Tag = as === "ol" ? m.ol : m.div;
  return (
    <Tag
      animate="show"
      className={className}
      initial="hidden"
      style={style}
      variants={container}
    >
      {children}
    </Tag>
  );
};

/**
 * Un hijo del grupo. `data-motion="reveal"` deja que el `<noscript>` del layout
 * lo devuelva a visible si nunca llega a correr JS.
 */
export const StaggerItem = ({
  as = "div",
  className,
  style,
  children,
}: CommonProps & { readonly as?: "div" | "li" }) => {
  const Tag = as === "li" ? m.li : m.div;
  return (
    <Tag
      className={className}
      data-motion="reveal"
      style={style}
      variants={item}
    >
      {children}
    </Tag>
  );
};
