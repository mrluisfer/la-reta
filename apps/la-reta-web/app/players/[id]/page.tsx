import { PageTransition } from "@/components/app/page-transition";
import { DeletePlayerButton } from "@/components/features/players/delete-player-button";
import {
  CommentsCount,
  PlayerComments,
} from "@/components/features/players/player-comments";
import { PlayerGoalHistory } from "@/components/features/players/player-goal-history";
import { PlayerHistory } from "@/components/features/players/player-history";
import { PlayerRadar } from "@/components/features/players/player-radar";
import {
  ClaimProfileButton,
  UnlinkProfileButton,
} from "@/components/features/players/profile-ownership";
import { SelectForTeamsButton } from "@/components/features/players/select-for-teams-button";
import { BackButton } from "@/components/shared/back-button";
import { FifaCard } from "@/components/shared/fifa-card";
import { Pitch } from "@/components/shared/pitch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isAdmin } from "@/lib/admin";
import {
  GROUP_COLOR,
  GROUP_LABEL,
  POSITION_NAME,
  positionGroup,
  STAT_KEYS,
  STAT_LABEL,
} from "@/lib/constants";
import { flagEmoji, playerPositions } from "@/lib/format";
import {
  getCommentReactions,
  getOwnedPlayerId,
  getPlayerById,
  getPlayerComments,
  getPlayerGoalHistory,
  getPlayerHistory,
} from "@/lib/queries";
import { cardTier, TIER_LABEL } from "@/lib/ratings";
import { auth } from "@clerk/nextjs/server";
import { PencilIcon, UserPenIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

const FOOT_LABEL: Record<string, string> = {
  left: "Izquierdo",
  right: "Derecho",
  both: "Ambos",
};

function statColor(v: number) {
  if (v >= 80) return "bg-emerald-500";
  if (v >= 65) return "bg-amber-500";
  return "bg-rose-500";
}

export const dynamic = "force-dynamic";

const PlayerDetailPage = async ({
  params,
}: {
  readonly params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  const numId = Number(id);
  const [player, history, comments, reactions, goalHistory, admin, { userId }] =
    await Promise.all([
      getPlayerById(numId),
      getPlayerHistory(numId),
      getPlayerComments(numId),
      getCommentReactions(numId),
      getPlayerGoalHistory(numId),
      isAdmin(),
      auth(),
    ]);
  if (!player) notFound();

  const isOwner = Boolean(userId) && player.clerkUserId === userId;
  // Una vinculación por cuenta: si ya tienes un jugador vinculado, no puedes reclamar otro.
  const ownedPlayerId = await getOwnedPlayerId(userId);
  const canClaim =
    Boolean(userId) &&
    !player.clerkUserId &&
    !isOwner &&
    ownedPlayerId === null;

  const group = positionGroup(player.position);
  const tier = cardTier(player.overall);

  const facts: { label: string; value: string }[] = [
    { label: "Edad", value: `${player.age} años` },
    { label: "Altura", value: `${player.heightCm} cm` },
    { label: "Peso", value: `${player.weightKg} kg` },
    { label: "Pie", value: FOOT_LABEL[player.preferredFoot] },
    {
      label: "País",
      value: `${flagEmoji(player.nationality)} ${player.nationality.toUpperCase()}`,
    },
  ];

  return (
    <PageTransition>
      <div className="mx-auto max-w-5xl space-y-6 xl:max-w-6xl 2xl:max-w-[90rem]">
        <div className="grid gap-8 md:grid-cols-[260px_1fr] md:items-start 2xl:grid-cols-[300px_1fr]">
          {/* El botón de regresar vive dentro de la columna pegajosa, así que se
            queda a la vista junto con la carta mientras se hace scroll. */}
          <div className="mx-auto w-full max-w-[260px] space-y-3 md:sticky md:top-16 2xl:max-w-[300px]">
            <BackButton />
            <FifaCard className="card-shine" player={player} sizes="300px" />
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{player.position}</Badge>
                {player.position2 ? (
                  <Badge variant="outline">{player.position2}</Badge>
                ) : null}
                <Badge variant="secondary">{GROUP_LABEL[group]}</Badge>
                <Badge variant="outline">{TIER_LABEL[tier]}</Badge>
              </div>
              <h1 className="mt-2 text-3xl font-black tracking-tight">
                {player.name}
              </h1>
              <p className="text-muted-foreground text-sm">
                Overall{" "}
                <span className="text-foreground font-bold">
                  {player.overall}
                </span>
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {admin ? (
                <Button render={<Link href={`/players/${player.id}/edit`} />}>
                  <PencilIcon />
                  Editar
                </Button>
              ) : isOwner ? (
                <Button render={<Link href={`/players/${player.id}/edit`} />}>
                  <UserPenIcon />
                  Editar mi información
                </Button>
              ) : null}
              {canClaim ? <ClaimProfileButton playerId={player.id} /> : null}
              <SelectForTeamsButton size="default" id={player.id} />
              {admin && player.clerkUserId ? (
                <UnlinkProfileButton playerId={player.id} />
              ) : null}
              {admin ? (
                <DeletePlayerButton id={player.id} name={player.name} />
              ) : null}
            </div>

            {userId &&
            !player.clerkUserId &&
            !isOwner &&
            ownedPlayerId !== null ? (
              <p className="text-muted-foreground text-xs">
                Ya tienes un perfil vinculado a tu cuenta.{" "}
                <Link
                  href={`/players/${ownedPlayerId}`}
                  className="text-primary underline"
                >
                  Ver mi perfil
                </Link>
              </p>
            ) : null}

            {/* Datos */}
            <div className="bg-foreground/10 ring-foreground/10 grid grid-cols-2 gap-px overflow-hidden rounded-lg ring-1 sm:grid-cols-3 xl:grid-cols-5">
              {facts.map((f) => (
                <div key={f.label} className="bg-card p-3">
                  <p className="text-muted-foreground text-xs uppercase">
                    {f.label}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold">{f.value}</p>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="grid gap-6 sm:grid-cols-2">
              <Card>
                <CardHeader className="border-b">
                  <CardTitle>Atributos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {STAT_KEYS.map((key) => (
                    <div key={key} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span>{STAT_LABEL[key]}</span>
                        <span className="font-mono font-bold tabular-nums">
                          {player[key]}
                        </span>
                      </div>
                      <div className="bg-muted h-1.5 overflow-hidden">
                        <div
                          className={`h-full ${statColor(player[key])}`}
                          style={{ width: `${player[key]}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="border-b">
                  <CardTitle>Radar</CardTitle>
                </CardHeader>
                <CardContent>
                  <PlayerRadar player={player} />
                </CardContent>
              </Card>
            </div>

            {/* Posición en cancha + historial */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader className="border-b">
                  <CardTitle>Posición en la cancha</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <Pitch highlight={playerPositions(player)} />
                  <div className="mt-4 space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                      <div
                        className="mt-1 size-2 shrink-0 rounded-full"
                        style={{
                          backgroundColor: GROUP_COLOR[group],
                        }}
                      />
                      <div>
                        <p className="font-medium">
                          {POSITION_NAME[player.position]}
                        </p>
                        <p className="text-muted-foreground">
                          Posición principal ({player.position})
                        </p>
                      </div>
                    </div>
                    {player.position2 ? (
                      <div className="flex items-start gap-3">
                        <div
                          className="mt-1 size-2 shrink-0 rounded-full"
                          style={{
                            backgroundColor:
                              GROUP_COLOR[positionGroup(player.position2)],
                          }}
                        />
                        <div>
                          <p className="font-medium">
                            {POSITION_NAME[player.position2]}
                          </p>
                          <p className="text-muted-foreground">
                            Posición secundaria ({player.position2})
                          </p>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="border-b">
                  <CardTitle>Historial de stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <PlayerHistory history={history} />
                </CardContent>
              </Card>
            </div>

            <PlayerGoalHistory history={goalHistory} />

            {/* Comentarios */}
            <Card>
              <CardHeader className="border-b">
                <CardTitle>
                  Reseñas ·{" "}
                  <CommentsCount
                    playerId={player.id}
                    initialData={{ comments, reactions }}
                  />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PlayerComments
                  playerId={player.id}
                  comments={comments}
                  reactions={reactions}
                  isAdmin={admin}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default PlayerDetailPage;
