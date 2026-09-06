"use client";

import { SPRING_SETTLE } from "@/components/motion/motion-tokens";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AnimatePresence, m } from "motion/react";
import { computeReta } from "@/lib/functions/compute-reta";
import { CDMX_TZ, DAY_MS, SHOW_WITHIN_DAYS } from "@/lib/match-dates";
import {
  CalendarClockIcon,
  RadioIcon,
  ShuffleIcon,
  UserRoundPlusIcon,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";

function midnight(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

const dateFmt = new Intl.DateTimeFormat("es-MX", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: CDMX_TZ,
});
const timeFmt = new Intl.DateTimeFormat("es-MX", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: CDMX_TZ,
});
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const pad = (n: number) => String(n).padStart(2, "0");

export const RetaCountdownBanner = () => {
  const [mounted, setMounted] = React.useState(false);

  const [, setTick] = React.useState(0);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    let timer: ReturnType<typeof setTimeout>;
    // Re-evalúa la ventana solo en cada medianoche local (no hay polling).
    const schedule = () => {
      const now = new Date();
      const next = midnight(new Date(now.getTime() + DAY_MS)).getTime() + 1000;
      timer = setTimeout(() => {
        setTick((t) => t + 1);
        schedule();
      }, next - now.getTime());
    };
    schedule();
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) return null; // evita mismatch SSR y costo cero fuera de la ventana

  const { daysUntil, kickoff } = computeReta(new Date());
  if (daysUntil > SHOW_WITHIN_DAYS) return null;

  return <Banner kickoff={kickoff} isToday={daysUntil === 0} />;
};

const Banner = ({
  kickoff,
  isToday,
}: {
  readonly kickoff: Date;
  readonly isToday: boolean;
}) => {
  // El ticker de 1s solo vive mientras el banner está montado (≤2 días al mes).
  const [remaining, setRemaining] = React.useState(
    () => kickoff.getTime() - Date.now()
  );
  React.useEffect(() => {
    const id = setInterval(
      () => setRemaining(kickoff.getTime() - Date.now()),
      1000
    );
    return () => clearInterval(id);
  }, [kickoff]);

  const kicked = remaining <= 0; // ya pasó la hora, pero sigue siendo el día
  const totalSec = Math.max(0, Math.floor(remaining / 1000));
  const units = [
    { label: "Días", value: String(Math.floor(totalSec / 86_400)) },
    { label: "Horas", value: pad(Math.floor((totalSec % 86_400) / 3_600)) },
    { label: "Min", value: pad(Math.floor((totalSec % 3_600) / 60)) },
    { label: "Seg", value: pad(totalSec % 60) },
  ];

  const dateLabel = cap(dateFmt.format(kickoff));
  const timeLabel = timeFmt.format(kickoff);
  const accent = isToday ? "text-amber-300" : "text-emerald-300";
  const dot = isToday ? "bg-amber-400" : "bg-emerald-400";

  return (
    <section
      className="ring-foreground/10 relative overflow-hidden rounded-lg text-white ring-1"
      style={{
        background:
          "radial-gradient(120% 140% at 0% 0%, rgba(52,211,153,0.16), transparent 45%), linear-gradient(135deg,#0b1224 0%,#141b3d 55%,#0b1224 100%)",
      }}
      aria-label={
        kicked
          ? `La reta es hoy, ${dateLabel} a las ${timeLabel} CDMX`
          : `Faltan ${units[0].value} días para la reta del ${dateLabel}`
      }
    >
      {/* Barrido de reflector — un solo acento en movimiento */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-y-8 -left-1/3 w-1/2 -skew-x-12 bg-white/[0.04] blur-2xl motion-safe:animate-pulse"
      />

      <div className="relative flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <span className="font-display inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.22em] uppercase">
            <span className="relative flex size-2">
              <span
                className={`absolute inline-flex h-full w-full rounded-full opacity-75 motion-safe:animate-ping ${dot}`}
              />
              <span
                className={`relative inline-flex size-2 rounded-full ${dot}`}
              />
            </span>
            <span className={accent}>
              {isToday ? "Hoy juega la reta" : "Cuenta regresiva"}
            </span>
          </span>

          <h2 className="font-display mt-1.5 text-3xl leading-none font-bold tracking-tight uppercase sm:text-4xl">
            {kicked ? "¡Es hora de la reta!" : "La próxima reta"}
          </h2>

          <p className="mt-2 flex items-center gap-1.5 text-sm text-white/70">
            <CalendarClockIcon className="size-4 shrink-0 text-white/50" />
            <span className="truncate">
              {dateLabel} · {timeLabel} CDMX
            </span>
          </p>
        </div>

        <div>
          <div className="mb-2 flex flex-wrap gap-2">
            <Button
              variant="secondary"
              className="shrink-0"
              render={<Link href="/players/registro" />}
            >
              <UserRoundPlusIcon />
              Registrarme
            </Button>
            <Button
              variant="default"
              className="shrink-0"
              render={<Link href={kicked ? "/live" : "/teams"} />}
            >
              {kicked ? (
                <>
                  <RadioIcon />
                  Ir al live
                </>
              ) : (
                <>
                  <ShuffleIcon />
                  Armar equipos
                </>
              )}
            </Button>
          </div>
          <div className="flex shrink-0 flex-col items-start gap-4 sm:flex-row sm:items-center">
            {!kicked && (
              <div className="flex gap-2" aria-hidden="true">
                {units.map((u) => (
                  <div
                    key={u.label}
                    className="w-16 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-2.5 text-center backdrop-blur-sm"
                  >
                    <div className="bg-gradient-to-b from-white to-emerald-200/80 bg-clip-text font-mono text-2xl leading-none font-black text-transparent tabular-nums sm:text-3xl">
                      <Odometer value={u.value} />
                    </div>
                    <div className="font-display mt-1 text-[9px] font-semibold tracking-[0.18em] text-white/45 uppercase">
                      {u.label}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

/**
 * Un dígito que rueda: el valor viejo sale por arriba mientras el nuevo sube
 * desde abajo, como el marcador mecánico de un estadio. La rejilla de una sola
 * celda mantiene ambos en el mismo sitio y `overflow-hidden` recorta el viaje.
 */
const Odometer = ({
  value,
  className,
}: {
  readonly value: string;
  readonly className?: string;
}) => (
  <span className={cn("inline-grid overflow-hidden", className)}>
    <AnimatePresence initial={false} mode="popLayout">
      <m.span
        animate={{ y: "0%", opacity: 1 }}
        className="col-start-1 row-start-1"
        exit={{ y: "-100%", opacity: 0 }}
        initial={{ y: "100%", opacity: 0 }}
        key={value}
        transition={SPRING_SETTLE}
      >
        {value}
      </m.span>
    </AnimatePresence>
  </span>
);
