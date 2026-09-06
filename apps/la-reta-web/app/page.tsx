import { ElevenBoard } from "@/components/app/eleven-board";
import { CountUp } from "@/components/motion/count-up";
import { SPRING_POP } from "@/components/motion/motion-tokens";
import { StaggerGroup, StaggerItem } from "@/components/motion/stagger-group";
import * as m from "motion/react-m";
import { RankingLevel } from "@/components/app/ranking-level";
import { ScorerNotFound } from "@/components/app/scorer-not-found";
import { Spotlight } from "@/components/app/spotlight";
import { Commentator } from "@/components/features/dashboard/commentator";
import { MatchdayBanner } from "@/components/features/dashboard/matchday-banner";
import { PlayerLegend } from "@/components/features/dashboard/player-legend";
import { RetaCountdownBanner } from "@/components/features/dashboard/reta-countdown-banner";
import { RotatingPlayer } from "@/components/features/dashboard/rotating-player";
import { RotatingScorer } from "@/components/features/dashboard/rotating-scorer";
import { MatchesChart } from "@/components/features/matches/matches-chart";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  positionGroup,
  STAT_ABBR,
  STAT_KEYS,
  type PositionGroup,
} from "@/lib/constants";
import type { Player } from "@/lib/db/schema";
import {
  getBannerWords,
  getMatches,
  getPlayers,
  getTopScorers,
} from "@/lib/queries";
import { InfoIcon, ShieldHalfIcon, UserPlusIcon } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const DashboardPage = async () => {
  const [players, bannerWords, topScorers, matches] = await Promise.all([
    getPlayers(),
    getBannerWords(),
    getTopScorers(),
    getMatches(),
  ]);

  if (players.length === 0) {
    return <EmptyState />;
  }

  const total = players.length;
  const avgOverall = Math.round(
    players.reduce((a, p) => a + p.overall, 0) / total
  );
  const avgAge = Math.round(players.reduce((a, p) => a + p.age, 0) / total);
  const best = players[0];
  const counts: Record<PositionGroup, number> = {
    GK: 0,
    DEF: 0,
    MID: 0,
    FWD: 0,
  };
  for (const p of players) counts[positionGroup(p.position)]++;

  // Everyone tied for the most goals — the spotlight rotates through them.
  // Independiente del orden de la tabla (getTopScorers ordena por G+A).
  const maxGoals = Math.max(0, ...topScorers.map((s) => s.goals));
  const tiedScorers: {
    player: (typeof players)[number];
    goals: number;
    matches: number;
  }[] = [];
  const playersById = new Map(players.map((p) => [p.id, p]));
  for (const scorer of topScorers) {
    // playerId es null en los invitados: esos no tienen ficha que mostrar.
    if (scorer.goals !== maxGoals || scorer.goals === 0) continue;
    if (scorer.playerId == null) continue;
    const player = playersById.get(scorer.playerId);
    if (!player) continue;
    tiedScorers.push({
      player,
      goals: scorer.goals,
      matches: scorer.matches,
    });
  }

  return (
    // El dashboard entra por bloques, de arriba abajo: el ojo sigue el orden de
    // lectura en vez de recibir toda la página de golpe. Los wrappers de Motion
    // solo reciben `children`, así que esta página sigue siendo Server Component.
    <StaggerGroup className="space-y-6 xl:container xl:mx-auto">
      {/* Countdown a la próxima reta (solo ≤2 días antes)  */}
      <RetaCountdownBanner />

      {/*  Matchday banner  */}
      <StaggerItem>
        <MatchdayBanner
          bannerWords={bannerWords}
          stats={{
            total,
            avgOverall,
            avgAge,
            leaderOverall: best.overall,
            leaderName: best.displayName,
          }}
        />
      </StaggerItem>

      {/* Destacados: crack + goleador + jugadores (horizontal en desktop) */}
      <StaggerItem className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <Spotlight
          highlight
          title="El crack"
          subtitle="Mayor overall de la plantilla"
          player={best}
          statValue={best.overall}
          statLabel="OVR"
          footer={<StatStrip player={best} />}
        />
        {tiedScorers.length > 0 ? (
          <RotatingScorer scorers={tiedScorers} />
        ) : (
          <ScorerNotFound />
        )}
        <RotatingPlayer players={players} />
      </StaggerItem>

      <StaggerItem className="grid gap-6 lg:grid-cols-2">
        <Commentator />
        <PlayerLegend />
      </StaggerItem>

      {/* Pizarra + ranking  */}
      <StaggerItem className="grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-start">
        <div className="space-y-2">
          {/* Pizarra del once ideal */}
          <ElevenBoard players={players} counts={counts} />
          <Alert>
            <InfoIcon />
            <AlertTitle>Importante!</AlertTitle>
            <AlertDescription>
              Este proyecto es solo &quot;For Fun&quot;. No se busca lucro ni
              afectar a terceros. La idea es pasarnosla bien y divertirnos en
              cada reta.
            </AlertDescription>
          </Alert>
        </div>

        {/* Ranking + gráfica comparativa de partidos */}
        <div className="space-y-6">
          <RankingLevel players={players} />
          {matches.length > 0 && <MatchesChart matches={matches} />}
        </div>
      </StaggerItem>
    </StaggerGroup>
  );
};

export default DashboardPage;

/** Compact 6-attribute strip used in the "El crack" spotlight footer. */
const StatStrip = ({ player }: { readonly player: Player }) => {
  return (
    <m.div
      animate="show"
      className="grid w-full grid-cols-6 gap-1"
      initial="hidden"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.05, delayChildren: 0.25 } },
      }}
    >
      {STAT_KEYS.map((k) => (
        <m.div
          className="text-center"
          data-motion="reveal"
          key={k}
          variants={{
            hidden: { opacity: 0, y: 8 },
            show: { opacity: 1, y: 0, transition: SPRING_POP },
          }}
        >
          <p className="font-mono text-sm leading-none font-bold tabular-nums">
            <CountUp value={player[k]} />
          </p>
          <p className="text-muted-foreground mt-0.5 text-xs font-semibold tracking-wide">
            {STAT_ABBR[k]}
          </p>
        </m.div>
      ))}
    </m.div>
  );
};

const EmptyState = () => {
  return (
    <div className="mx-auto max-w-md py-24 text-center">
      <ShieldHalfIcon className="text-muted-foreground mx-auto size-10" />
      <h1 className="mt-4 text-xl font-bold">Aún no hay jugadores</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Crea el primero o corre el seed para poblar la base de datos.
      </p>
      <Button className="mt-4" render={<Link href="/players/new" />}>
        <UserPlusIcon />
        Crear jugador
      </Button>
    </div>
  );
};
