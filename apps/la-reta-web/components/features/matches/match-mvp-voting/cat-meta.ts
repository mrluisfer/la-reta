import { VoteCategory } from "@/lib/match-votes";
import { GoalIcon, LucideIcon, ThumbsDownIcon, TrophyIcon } from "lucide-react";

export const CAT_META: Record<
  VoteCategory,
  {
    icon: LucideIcon;
    chip: string;
    bar: string;
    text: string;
    /** Color crudo del acento: lo piden el SVG del anillo y los degradados,
     *  donde una clase de Tailwind no sirve. */
    accent: string;
  }
> = {
  figura: {
    icon: TrophyIcon,
    chip: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    bar: "bg-amber-500",
    text: "text-amber-600 dark:text-amber-400",
    accent: "var(--color-amber-500)",
  },
  gol: {
    icon: GoalIcon,
    chip: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    bar: "bg-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
    accent: "var(--color-emerald-500)",
  },
  error: {
    icon: ThumbsDownIcon,
    chip: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
    bar: "bg-rose-500",
    text: "text-rose-600 dark:text-rose-400",
    accent: "var(--color-rose-500)",
  },
};
