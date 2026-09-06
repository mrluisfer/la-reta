import { PANEL_TILT } from "@/components/motion/motion-tokens";
import { TiltCard } from "@/components/motion/tilt-card";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { QuoteIcon, StarIcon } from "lucide-react";
import Image from "next/image";
import { ChouchaLegend } from "./choucha-legend";

/** Legendary player showcase — FIFA icon card aesthetic. */
export const PlayerLegend = () => {
  return (
    <Dialog>
      <DialogTrigger className="block w-full transition hover:brightness-110">
        <TiltCard className="rounded-lg lg:h-[264px]" {...PANEL_TILT}>
          <section
            aria-label="Jugador leyenda de la reta"
            className="relative h-full overflow-hidden rounded-lg bg-[linear-gradient(135deg,#3d2a00_0%,#5c3d00_30%,#3d2800_65%,#1e1400_100%)] text-white"
          >
            {/* subtle radial glow behind the image */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_40%_60%_at_15%_50%,rgba(251,191,36,0.18)_0%,transparent_70%)]"
            />

            {/* shimmer line at top */}
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent"
            />

            <div className="relative flex items-stretch">
              {/* Player image */}
              <div className="relative w-28 shrink-0 bg-black/30 sm:w-44">
                {/* gold vignette on the right edge */}
                <div
                  aria-hidden="true"
                  className="absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-[#3d2800]/80 to-transparent"
                />
                <Image
                  src="/players/choucha.webp"
                  alt="Choucha — leyenda de la reta"
                  width={480}
                  height={720}
                  sizes="(min-width: 640px) 176px, 112px"
                  className="h-full w-full object-cover object-top"
                  priority
                />
              </div>

              {/* Content */}
              <div className="flex flex-1 flex-col justify-center gap-2.5 p-5">
                <span className="font-display inline-flex w-fit items-center gap-1.5 rounded-full bg-amber-400/20 px-2.5 py-1 text-[11px] font-semibold tracking-[0.18em] text-amber-300 uppercase ring-1 ring-amber-400/30">
                  <StarIcon className="size-3.5 fill-amber-400 text-amber-400" />
                  Ícono de la reta
                </span>
                <h2 className="font-display text-left text-2xl font-bold tracking-tight uppercase sm:text-3xl">
                  Choucha
                </h2>
                <p className="relative max-w-md rounded-lg bg-white/10 p-3 pl-9 text-sm leading-relaxed text-white/90 ring-1 ring-white/10">
                  <QuoteIcon className="absolute top-3 left-3 size-4 text-amber-300/70" />
                  El ícono histórico de la reta. Gambeta, carácter y gol —
                  siempre el primero en ser elegido. 🌟⚽🔥
                </p>
              </div>
            </div>

            {/* shimmer line at bottom */}
            <div
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent"
            />
          </section>
        </TiltCard>
      </DialogTrigger>
      <ChouchaLegend />
    </Dialog>
  );
};
