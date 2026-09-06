import { CountUp } from "@/components/motion/count-up";
import { cn } from "@/lib/utils";

/** Cómo de pareja quedó la reta, en palabras. */
function balanceLabel(value: number) {
  if (value >= 80) return "Parejísimo";
  if (value >= 60) return "Equilibrado";
  if (value >= 40) return "Competido";
  if (value >= 20) return "Disparejo";
  return "Paliza";
}

function balanceTone(value: number) {
  if (value >= 60) return "text-emerald-500";
  if (value >= 40) return "text-amber-500";
  return "text-rose-500";
}

const Fact = ({
  label,
  value,
  detail,
  className,
}: {
  readonly label: string;
  readonly value: React.ReactNode;
  readonly detail?: string;
  readonly className?: string;
}) => (
  <div className="px-4 py-4 xl:px-6">
    <p className="text-muted-foreground text-[10px] font-semibold tracking-[0.16em] uppercase">
      {label}
    </p>
    <p
      className={cn(
        "font-display mt-1.5 text-3xl leading-none font-bold tabular-nums xl:text-4xl",
        className
      )}
    >
      {value}
    </p>
    {detail ? (
      <p className="text-muted-foreground mt-1 text-xs">{detail}</p>
    ) : null}
  </div>
);

/**
 * Los cuatro datos del partido, como una franja de cifras.
 *
 * Antes cada uno vivía en su propia tarjeta con un icono dentro de un cuadrado
 * de color: cuatro cajas iguales que pesaban lo mismo que el marcador sin
 * decir tanto. Aquí el peso lo lleva la tipografía y los separadores hacen de
 * estructura, así que la franja se lee de corrido y ocupa un tercio del alto.
 */
export const MatchFacts = ({
  totalGoals,
  pace,
  scorerCount,
  playerCount,
  guestGoals,
  balance,
  durationSec,
}: {
  readonly totalGoals: number;
  /** Minutos por gol, o null si no hay reloj. */
  readonly pace: number | null;
  readonly scorerCount: number;
  readonly playerCount: number;
  readonly guestGoals: number;
  readonly balance: number;
  readonly durationSec: number | null;
}) => {
  return (
    // En desktop es una sola fila de cuatro cifras dentro de la tarjeta; en
    // móvil se parte en dos por dos. El fondo la separa del resto de bloques
    // sin necesidad de un encabezado que la nombre.
    <section className="bg-card divide-border grid grid-cols-2 divide-x divide-y rounded-xl border sm:grid-cols-4 sm:divide-y-0">
      <Fact
        detail={pace ? `uno cada ${pace} min` : "sin reloj"}
        label="Goles"
        value={<CountUp value={totalGoals} />}
      />
      <Fact
        detail={
          guestGoals > 0
            ? `${guestGoals} de invitados`
            : `de ${playerCount} en cancha`
        }
        label="Goleadores"
        value={<CountUp value={scorerCount} />}
      />
      <Fact
        className={balanceTone(balance)}
        detail={balanceLabel(balance)}
        label="Balance"
        value={
          <>
            <CountUp value={balance} />
            <span className="text-muted-foreground text-base font-medium">
              /100
            </span>
          </>
        }
      />
      <Fact
        detail={durationSec ? "de reloj" : "no se registró"}
        label="Duración"
        value={
          durationSec ? (
            <>
              <CountUp value={Math.round(durationSec / 60)} />
              <span className="text-muted-foreground text-base font-medium">
                min
              </span>
            </>
          ) : (
            "—"
          )
        }
      />
    </section>
  );
};
