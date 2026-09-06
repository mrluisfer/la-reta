import { PANEL_TILT } from "@/components/motion/motion-tokens";
import { TiltCard } from "@/components/motion/tilt-card";
import { MicIcon, QuoteIcon } from "lucide-react";
import Image from "next/image";

/** Fun "pundit" panel on the dashboard. */
export function Commentator() {
  return (
    <TiltCard className="h-fit rounded-lg lg:h-[264px]" {...PANEL_TILT}>
      <section className="ring-foreground/10 h-full overflow-hidden rounded-lg bg-[linear-gradient(120deg,#241433_0%,#150d24_55%,#0b0816_100%)] text-white ring-1">
        <div className="flex items-stretch">
          <div className="relative w-28 shrink-0 bg-black/30 sm:w-44 lg:h-[264px]">
            <Image
              src="/players/chato-bermudez.webp"
              alt="Chato Bermúdez"
              width={480}
              height={720}
              className="h-full w-full object-cover object-top"
            />
          </div>
          <div className="flex flex-1 flex-col justify-center gap-2.5 p-5">
            <span className="font-display inline-flex w-fit items-center gap-1.5 rounded-full bg-rose-500/20 px-2.5 py-1 text-[11px] font-semibold tracking-[0.18em] text-rose-300 uppercase">
              <MicIcon className="size-3.5" />
              El comentarista
            </span>
            <h2 className="font-display text-2xl font-bold tracking-tight uppercase sm:text-3xl">
              Chatito Bermúdez
            </h2>
            <p className="relative max-w-md rounded-lg bg-white/10 p-3 pl-9 text-sm leading-relaxed text-white/90 ring-1 ring-white/10">
              <QuoteIcon className="absolute top-3 left-3 size-4 text-rose-300/70" />
              Le gustan las furras y programar, acá bien lokote. 🎙️🎶🔥
            </p>
          </div>
        </div>
      </section>
    </TiltCard>
  );
}
