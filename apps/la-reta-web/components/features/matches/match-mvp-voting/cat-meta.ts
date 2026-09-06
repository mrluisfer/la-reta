import { GoalIcon, ThumbsDownIcon, TrophyIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { VoteCategory } from "@/lib/match-votes";

export const CAT_META: Record<
  VoteCategory,
  {
    icon: LucideIcon;
    /**
     * Píldora de la categoría. El tono 800/300 no es capricho: la píldora cae
     * encima del halo de la tarjeta, así que su fondo real es el acento a ~29%
     * y con el 700 el texto se quedaba en 4.0:1, por debajo del 4.5:1 que pide
     * la WCAG para texto de 12 px.
     */
    chip: string;
    bar: string;
    /** Texto grande (>=24px en negrita): el tono 600 ya pasa el 3:1 que pide
     *  la WCAG para texto grande, cosa que el 500 crudo no hace. */
    text: string;
    /**
     * Texto pequeño: hace falta 4.5:1, así que baja un tono más.
     */
    strong: string;
    /** Color crudo del acento: lo piden el SVG del anillo y los degradados,
     *  donde una clase de Tailwind no sirve. */
    accent: string;
  }
> = {
  figura: {
    icon: TrophyIcon,
    chip: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
    bar: "bg-amber-500",
    text: "text-amber-600 dark:text-amber-400",
    strong: "text-amber-700 dark:text-amber-400",
    accent: "var(--color-amber-500)",
  },
  gol: {
    icon: GoalIcon,
    chip: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300",
    bar: "bg-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
    strong: "text-emerald-700 dark:text-emerald-400",
    accent: "var(--color-emerald-500)",
  },
  error: {
    icon: ThumbsDownIcon,
    chip: "bg-rose-500/15 text-rose-800 dark:text-rose-300",
    bar: "bg-rose-500",
    text: "text-rose-600 dark:text-rose-400",
    strong: "text-rose-700 dark:text-rose-400",
    accent: "var(--color-rose-500)",
  },
};
