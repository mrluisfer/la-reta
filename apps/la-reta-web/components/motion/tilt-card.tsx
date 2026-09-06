"use client";

import { cn } from "@/lib/utils";
import {
  m,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type Variants,
} from "motion/react";
import type { PointerEvent, ReactNode } from "react";
import { SPRING_SNAP } from "./motion-tokens";
import { useFinePointer } from "./use-fine-pointer";

/** Grados máximos de inclinación en cada eje. */
const MAX_TILT = 11;

/** Centro de la carta: la posición de reposo de los dos ejes. */
const CENTER = 0.5;

/** Carta FIFA: el objeto es pequeño y aguanta un gesto marcado. */
const DEFAULT_HOVER_SCALE = 1.05;
const DEFAULT_HOVER_LIFT = 40;
const DEFAULT_GLARE = 1;

/**
 * Inclinación 3D siguiendo el puntero, con un brillo especular que se mueve con
 * él. Es el gesto que hace que una carta FIFA se sienta como un objeto y no como
 * una imagen — justo lo que ni CSS ni las View Transitions pueden dar.
 *
 * Recibe `children`, así que la `FifaCard` sigue siendo Server Component. Se
 * apaga sin puntero de precisión (en táctil robaría scroll sin aportar nada) y
 * con `prefers-reduced-motion`.
 */
export const TiltCard = ({
  children,
  className,
  maxTilt = MAX_TILT,
  hoverScale = DEFAULT_HOVER_SCALE,
  hoverLift = DEFAULT_HOVER_LIFT,
  glareStrength = DEFAULT_GLARE,
}: {
  readonly children: ReactNode;
  readonly className?: string;
  /** Grados máximos de inclinación en cada eje. */
  readonly maxTilt?: number;
  /** Cuánto crece al pasar el puntero. */
  readonly hoverScale?: number;
  /** Cuánto se acerca al espectador, en px de `translateZ`. */
  readonly hoverLift?: number;
  /** Opacidad máxima del brillo especular, 0–1. */
  readonly glareStrength?: number;
}) => {
  const pointerX = useMotionValue(CENTER);
  const pointerY = useMotionValue(CENTER);
  const smoothX = useSpring(pointerX, SPRING_SNAP);
  const smoothY = useSpring(pointerY, SPRING_SNAP);

  const rotateY = useTransform(smoothX, [0, 1], [-maxTilt, maxTilt]);
  const rotateX = useTransform(smoothY, [0, 1], [maxTilt, -maxTilt]);
  // `useTransform` con función en vez de `useMotionTemplate`: el React Compiler
  // no sabe compilar un tagged template con interpolaciones.
  const glareImage = useTransform(
    [smoothX, smoothY],
    ([x, y]: number[]) =>
      `radial-gradient(circle at ${x * 100}% ${y * 100}%, rgb(255 255 255 / 34%), rgb(255 255 255 / 6%) 34%, transparent 62%)`
  );

  // Sin `useMemo`: este componente solo se vuelve a renderizar si cambia el tipo
  // de puntero o la preferencia de movimiento. El seguimiento del cursor va por
  // MotionValues, que no disparan renders, así que recrear estos dos objetos no
  // cuesta nada.
  const shell: Variants = {
    rest: { scale: 1, z: 0 },
    hover: { scale: hoverScale, z: hoverLift },
  };
  const glare: Variants = {
    rest: { opacity: 0 },
    hover: { opacity: glareStrength },
  };

  const reduceMotion = useReducedMotion();
  const finePointer = useFinePointer();
  const enabled = finePointer && !reduceMotion;

  if (!enabled) {
    return <div className={className}>{children}</div>;
  }

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    pointerX.set((event.clientX - rect.left) / rect.width);
    pointerY.set((event.clientY - rect.top) / rect.height);
  };

  const recenter = () => {
    pointerX.set(CENTER);
    pointerY.set(CENTER);
  };

  return (
    <m.div
      animate="rest"
      className={cn("relative", className)}
      initial="rest"
      onPointerLeave={recenter}
      onPointerMove={onPointerMove}
      style={{
        rotateX,
        rotateY,
        transformPerspective: 900,
        transformStyle: "preserve-3d",
      }}
      transition={SPRING_SNAP}
      variants={shell}
      whileHover="hover"
    >
      {children}
      <m.span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-30 rounded-[inherit] mix-blend-soft-light"
        style={{ backgroundImage: glareImage }}
        variants={glare}
      />
    </m.div>
  );
};
