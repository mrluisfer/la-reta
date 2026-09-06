import { PageTransition } from "@/components/app/page-transition";
import { MatchFacts } from "@/components/features/matches/detail/match-facts";
import { ScoreShareCard } from "@/components/features/matches/detail/score-share-card";
import { TopScorersPodium } from "@/components/features/matches/detail/top-scorers-podium";
import { TeamLineupCard } from "@/components/features/matches/detail/team-lineup-card";
import { MatchHero } from "@/components/features/matches/match-hero";
import {
  MatchMvpVoting,
  type VoteCandidate,
} from "@/components/features/matches/match-mvp-voting";
import { SectionHeading } from "@/components/shared/section-heading";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { isAdmin } from "@/lib/admin";
import { formatLongDate, formatShortDateOnly } from "@/lib/dates";
import { candidateKey, isVotingOpen, votingClosesAt } from "@/lib/match-votes";
import {
  getMatchById,
  getMatchVoteTally,
  getMyMatchVotes,
} from "@/lib/queries";
import { matchTeams, TEAM_COLORS } from "@/lib/teams";
import { auth } from "@clerk/nextjs/server";
import { PencilIcon } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export const metadata: Metadata = { title: "Detalle de partido · Reta Fútbol" };
export const dynamic = "force-dynamic";

/** Minutos por gol; sin reloj o sin goles no hay ritmo que contar. */
function matchPace(totalGoals: number, durationSec: number | null) {
  if (!(durationSec && totalGoals)) return null;
  return Math.round(durationSec / 60 / totalGoals);
}

const MatchDetailPage = async ({
  params,
}: {
  readonly params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  const [match, admin, { userId }] = await Promise.all([
    getMatchById(Number(id)),
    isAdmin(),
    auth(),
  ]);

  if (!match) notFound();

  //  Votación de premios (Figura / Golazo / Error)
  // Votar es exclusivo de cuentas: el PIN de admin no vota.
  const voterId = userId ?? null;
  const [voteTally, myVotes] = await Promise.all([
    getMatchVoteTally(match.id),
    getMyMatchVotes(match.id, voterId),
  ]);
  const votingOpen = isVotingOpen(match.createdAt);
  const closesLabel = formatLongDate(votingClosesAt(match.createdAt));
  // Candidatos = participantes únicos del partido (roster o invitado).
  const voteCandidates: VoteCandidate[] = [];
  const seenCandidates = new Set<string>();
  for (const s of match.scorers) {
    const guestName = s.isGuest ? s.name : null;
    const key = candidateKey({ playerId: s.playerId, guestName });
    if (seenCandidates.has(key)) continue;
    seenCandidates.add(key);
    voteCandidates.push({
      key,
      playerId: s.playerId,
      guestName,
      name: s.name,
      photoUrl: s.photoUrl,
      team: s.team,
      isGuest: s.isGuest,
    });
  }

  // Una reta puede haberse jugado con 3+ equipos: todo se deriva de la lista.
  const teams = matchTeams(match);
  const totalGoals = teams.reduce((n, t) => n + t.score, 0);
  const best = Math.max(...teams.map((t) => t.score));
  const leaders = teams.filter((t) => t.score === best);
  const winner = leaders.length === 1 ? leaders[0].name : null;
  const teamSquads = teams.map((team) => ({
    ...team,
    scorers: match.scorers.filter((scorer) => scorer.team === team.key),
  }));
  const unassignedScorers = match.scorers.filter(
    (scorer) => !teams.some((t) => t.key === scorer.team)
  );

  const scored = match.scorers
    .filter((s) => s.goals > 0)
    .sort((a, b) => b.goals - a.goals);

  const guestGoals = match.scorers
    .filter((s) => s.isGuest)
    .reduce((n, s) => n + s.goals, 0);

  return (
    <PageTransition>
      {/* La web se usa sobre todo en escritorio: a 1440 px un contenedor de
          1024 dejaba media pantalla vacía y obligaba a apilar en una columna
          lo que cabe de sobra en dos. */}
      <div className="mx-auto max-w-6xl space-y-6 2xl:max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link href="/" />}>Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink
                  render={
                    <Link href="/matches" transitionTypes={["nav-back"]} />
                  }
                >
                  Partidos
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Detalle del partido</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          {admin ? (
            <Button
              render={<Link href={`/matches/${match.id}/edit`} />}
              variant="default"
            >
              <PencilIcon />
              Editar información
            </Button>
          ) : null}
        </div>

        <MatchHero
          admin={admin}
          dateLabel={formatShortDateOnly(match.playedAt)}
          matchId={match.id}
          photoUrl={match.photoUrl}
          teams={teams}
          winner={winner}
        />

        {match.notes ? (
          // Las notas son la voz de quien estuvo ahí: van como cita, no como un
          // `h2` en versalitas con un hover a negro que en tema oscuro
          // desaparecía sobre el fondo.
          <figure className="border-primary/40 border-l-2 pl-4">
            <blockquote className="text-muted-foreground text-sm text-balance italic">
              “{match.notes}”
            </blockquote>
          </figure>
        ) : null}

        <MatchFacts
          balance={match.balance}
          durationSec={match.durationSec}
          guestGoals={guestGoals}
          pace={matchPace(totalGoals, match.durationSec)}
          playerCount={match.scorers.length}
          scorerCount={scored.length}
          totalGoals={totalGoals}
        />

        {/* Quién anotó y de qué lado cayeron los goles son la misma pregunta
            vista de dos maneras: en escritorio van en la misma fila. Antes el
            máximo goleador salía además en su propia tarjeta, repitiendo al
            que ya ocupa el oro del podio. */}
        <section className="space-y-3">
          <SectionHeading count={scored.length} title="Quién anotó" />
          <div className="grid gap-4 lg:grid-cols-3 lg:items-stretch">
            {scored.length > 0 ? (
              <div className="lg:col-span-2">
                <TopScorersPodium scored={scored} teams={teams} />
              </div>
            ) : (
              <Card className="grid place-items-center lg:col-span-2">
                <p className="text-muted-foreground p-8 text-sm">
                  No se registraron goles en este partido.
                </p>
              </Card>
            )}
            <ScoreShareCard teams={teams} />
          </div>
        </section>

        <MatchMvpVoting
          canVote={Boolean(userId)}
          candidates={voteCandidates}
          closesLabel={closesLabel}
          matchId={match.id}
          myVotes={myVotes}
          tally={voteTally}
          votingOpen={votingOpen}
        />

        <section className="space-y-3">
          <SectionHeading count={match.scorers.length} title="Alineaciones" />
          {match.scorers.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              No se registraron jugadores ni goleadores para este partido.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {teamSquads.map((team) => (
                <div className="reveal-on-scroll" key={team.key}>
                  <TeamLineupCard
                    // Valla invicta: nadie más anotó en todo el partido.
                    cleanSheet={totalGoals > 0 && totalGoals === team.score}
                    color={TEAM_COLORS[team.key]}
                    score={team.score}
                    scorers={team.scorers}
                    title={team.name}
                  />
                </div>
              ))}
              {unassignedScorers.length > 0 ? (
                <div className="reveal-on-scroll">
                  <TeamLineupCard
                    score={unassignedScorers.reduce((n, s) => n + s.goals, 0)}
                    scorers={unassignedScorers}
                    title="Sin equipo asignado"
                  />
                </div>
              ) : null}
            </div>
          )}
        </section>
      </div>
    </PageTransition>
  );
};

export default MatchDetailPage;
