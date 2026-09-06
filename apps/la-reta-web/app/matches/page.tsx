import { PageTransition } from "@/components/app/page-transition";
import { MatchHistoryList } from "@/components/features/matches/match-history-list";
import { MatchesChart } from "@/components/features/matches/matches-chart";
import { RetaMatchForm } from "@/components/features/matches/reta-match-form";
import { TopScorersCard } from "@/components/features/matches/top-scorers-card";
import type { RetaToMatchItem } from "@/components/features/teams/registro/reta-to-match-list";
import { PageHeader } from "@/components/shared/page-header";
import { SectionHeading } from "@/components/shared/section-heading";
import { isAdmin } from "@/lib/admin";
import { formatApiDate, formatCompactDate, formatTime } from "@/lib/dates";
import {
  getGeneratedRetas,
  getMatches,
  getPlayers,
  getTopScorers,
  retaTeams,
} from "@/lib/queries";
import type { TeamKey } from "@/lib/teams";
import { Metadata } from "next";

export const metadata: Metadata = { title: "Partidos · Reta Fútbol" };
export const dynamic = "force-dynamic";

const MatchesPage = async () => {
  const [players, matches, scorers, admin, retas] = await Promise.all([
    getPlayers(),
    getMatches(),
    getTopScorers(),
    isAdmin(),
    // Últimas retas generadas: el alta manual puede partir de cualquiera de sus
    // duelos (una reta de 3+ equipos se registra como varios partidos).
    getGeneratedRetas(10),
  ]);

  const formPlayers = [...players]
    .map((p) => ({ id: p.id, name: p.name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const retaOptions: RetaToMatchItem[] = retas.map((r) => ({
    id: r.id,
    // La hora distingue las varias generaciones "de práctica" del mismo día.
    dateLabel: `${formatCompactDate(r.createdAt)} ${formatTime(r.createdAt)}`,
    playedAt: formatApiDate(r.createdAt),
    teams: retaTeams(r),
    players: r.players.map((p) => ({
      playerId: p.playerId,
      guestName: p.isGuest ? p.name : null,
      team: p.team as TeamKey,
      name: p.name,
    })),
  }));

  return (
    <PageTransition>
      <div className="mx-auto max-w-5xl space-y-6 lg:max-w-6xl 2xl:max-w-7xl">
        <PageHeader
          title="Partidos"
          description="Registra los resultados de la reta y lleva la tabla de goleadores."
        />

        <RetaMatchForm
          retas={retaOptions}
          players={formPlayers}
          admin={admin}
        />

        <div className="grid gap-6 lg:grid-cols-[1fr_300px] lg:items-start">
          <section className="space-y-3">
            <SectionHeading title="Historial" count={matches.length} />
            <MatchHistoryList matches={matches} admin={admin} />
            {matches.length > 0 && <MatchesChart matches={matches} />}
          </section>

          {/* top-16, no top-6: el header es sticky (h-12) y con 6 la tabla de
            goleadores se metía debajo al hacer scroll.
            La tabla crece con cada jornada; sin un techo, al fijarla acababa
            más alta que la ventana y su final quedaba fuera de alcance. Con
            `dvh` el tope sigue a la barra del navegador en móvil, y
            `overscroll-contain` evita que al terminar de recorrerla el scroll
            salte a la página de atrás. */}
          <section className="space-y-3 lg:sticky lg:top-16">
            <SectionHeading
              title="Goles y asistencias"
              count={scorers.length}
            />
            <div className="lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto lg:overscroll-contain">
              <TopScorersCard scorers={scorers} />
            </div>
          </section>
        </div>
      </div>
    </PageTransition>
  );
};

export default MatchesPage;
