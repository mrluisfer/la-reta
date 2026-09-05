import { Pressable, View } from "react-native";

import { MatchPhoto } from "@/components/match-photo";
import { PlayerAvatar } from "@/components/player-avatar";
import { Icon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import { Surface } from "@/components/ui/surface";
import { Text } from "@/components/ui/text";
import { Palette, Radius, Shadow, Spacing } from "@/constants/theme";
import { formatMatchDate } from "@/lib/dates";
import { matchTeams, rankedTeams, type RankedTeam } from "@/lib/teams";
import type { Match, MatchTeam, Player, Scorer } from "@/lib/types";

/**
 * Cómo quedó un partido, en tarjeta.
 *
 * Hay dos formas porque hay dos partidos distintos. Un duelo se enseña como
 * rótulo de televisión, los dos nombres a los lados y el resultado en medio.
 * Una reta de tres o más no es eso: es una tabla, y forzarla al molde del 1v1
 * —dos equipos grandes arriba y el tercero en letra chica debajo— contaba mal
 * el partido del 20 de agosto, donde Cariñosas hizo 6 y salía de nota al pie
 * detrás de un 8–1 que ningún equipo jugó a solas.
 *
 * `featured` viste el más reciente en verde macizo. En una lista de cinco
 * tarjetas blancas idénticas, el último partido —el que la gente viene a ver—
 * no se distinguía de uno de hace tres meses.
 *
 * Los goleadores van en fichas con cara y no en una lista de nombres separados
 * por puntos: en un partido de ocho goles esa línea se leía como un párrafo, y
 * la cara reconoce a la gente antes que el texto.
 *
 * Cuando el partido tiene foto, entra como franja a sangre en la cabecera. Es
 * lo que convierte la lista en un recuerdo y no en una tabla de resultados: el
 * marcador dice cómo quedó, la foto dice quiénes estaban. Los que no la tienen
 * no dejan hueco ni marco vacío — la tarjeta empieza directamente en la fecha.
 */
export function MatchCard({
  match,
  players,
  showDate = false,
  featured = false,
  onPress,
}: {
  match: Match;
  /** Roster para resolver la foto de cada goleador; sin él van solo los nombres. */
  players?: Player[] | null;
  showDate?: boolean;
  featured?: boolean;
  onPress?: () => void;
}) {
  const scorers = match.scorers.filter((scorer) => scorer.goals > 0);
  const teams = matchTeams(match);
  const ranked = rankedTeams(match);
  const isDuel = teams.length === 2;

  const ink = featured ? "onAccent" : "ink";
  const soft = featured ? "onAccent" : "muted";
  /** En verde no hay gris: al que no ganó se le baja el cuerpo, no el color. */
  const dimmed = featured ? { opacity: 0.72 } : undefined;
  const line = featured ? "rgba(255, 255, 255, 0.24)" : Palette.hairline;

  const body = (
    <Surface
      padded={false}
      style={{
        // Recorta la franja contra el redondeo de la tarjeta; sin esto la foto
        // saca las esquinas por fuera del filete.
        overflow: "hidden",
        ...(featured
          ? {
              backgroundColor: Palette.accent,
              borderColor: Palette.accent,
              boxShadow: Shadow.accent,
            }
          : null),
      }}
    >
      <MatchPhoto
        alt={`${teams.map((team) => team.name).join(", ")} · ${formatMatchDate(match.playedAt)}`}
        url={match.photoUrl}
      />

      <View style={{ gap: Spacing.three, padding: Spacing.four }}>
        {showDate || featured ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: Spacing.two,
            }}
          >
            <Text
              style={featured ? { opacity: 0.85 } : undefined}
              tone={featured ? "onAccent" : "faint"}
              variant="eyebrow"
            >
              {formatMatchDate(match.playedAt)}
              {isDuel ? "" : ` · ${teams.length} equipos`}
            </Text>

            {featured ? (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: Spacing.one,
                  paddingHorizontal: Spacing.two,
                  paddingVertical: 3,
                  borderRadius: Radius.pill,
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                }}
              >
                <Icon
                  color={Palette.accentInk}
                  name="flame"
                  size={12}
                  strokeWidth={2}
                />
                <Text tone="onAccent" variant="eyebrow">
                  Último
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {isDuel ? (
          <Duel ink={ink} teams={teams} />
        ) : (
          <View>
            {ranked.map((team, index) => (
              <StandingsRow
                dimmed={dimmed}
                ink={ink}
                key={team.key}
                last={index === ranked.length - 1}
                line={line}
                soft={soft}
                team={team}
              />
            ))}
          </View>
        )}

        <View style={{ height: 1, backgroundColor: line }} />

        {scorers.length === 0 ? (
          <Text
            style={featured ? { opacity: 0.8 } : undefined}
            tone={featured ? "onAccent" : "faint"}
            variant="caption"
          >
            Sin goleadores registrados.
          </Text>
        ) : (
          <View
            style={{ flexDirection: "row", flexWrap: "wrap", gap: Spacing.two }}
          >
            {scorers.map((scorer) => (
              <ScorerChip
                featured={featured}
                key={`${scorer.playerId ?? "guest"}-${scorer.displayName}`}
                player={
                  players?.find((item) => item.id === scorer.playerId) ?? null
                }
                scorer={scorer}
              />
            ))}
          </View>
        )}
      </View>
    </Surface>
  );

  if (onPress === undefined) return body;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
    >
      {body}
    </Pressable>
  );
}

/**
 * Los dos nombres a los lados y la cifra en medio, como un rótulo de tele.
 *
 * Va en el orden del acta y no en el del marcador: en un duelo cada equipo
 * tiene su lado, y ordenarlos por goles movería a la gente de sitio según
 * cómo quedó.
 */
function Duel({ teams, ink }: { teams: MatchTeam[]; ink: "ink" | "onAccent" }) {
  const [home, away] = teams;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.three,
      }}
    >
      <Text
        numberOfLines={1}
        style={{ flex: 1 }}
        tone={ink}
        variant="bodyStrong"
      >
        {home.name}
      </Text>
      <Text selectable tone={ink} variant="stat">
        {home.score}–{away.score}
      </Text>
      <Text
        numberOfLines={1}
        style={{ flex: 1, textAlign: "right" }}
        tone={ink}
        variant="bodyStrong"
      >
        {away.name}
      </Text>
    </View>
  );
}

/**
 * Una fila de la tabla: puesto, equipo y goles.
 *
 * El puesto va delante porque es lo que se pregunta primero en una reta de
 * tres. Va en cifra chica y apagada: ordena la lectura sin competir con los
 * goles, que son el dato.
 */
function StandingsRow({
  team,
  last,
  line,
  ink,
  soft,
  dimmed,
}: {
  team: RankedTeam;
  last: boolean;
  line: string;
  ink: "ink" | "onAccent";
  soft: "muted" | "onAccent";
  dimmed: { opacity: number } | undefined;
}) {
  const tone = team.isWinner ? ink : soft;
  const fade = team.isWinner ? undefined : dimmed;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.three,
        paddingVertical: Spacing.two,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: line,
      }}
    >
      <Text style={[{ width: 14 }, fade]} tone={soft} variant="eyebrow">
        {team.rank}
      </Text>

      <Text
        numberOfLines={1}
        style={[{ flex: 1 }, fade]}
        tone={tone}
        variant="bodyStrong"
      >
        {team.name}
      </Text>

      <Text style={fade} tone={tone} variant="statSmall">
        {team.score}
      </Text>
    </View>
  );
}

function ScorerChip({
  scorer,
  player,
  featured,
}: {
  scorer: Scorer;
  player: Player | null;
  featured: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.two,
        paddingRight: Spacing.three,
        paddingLeft: player ? Spacing.half : Spacing.three,
        paddingVertical: Spacing.half,
        borderRadius: Radius.pill,
        backgroundColor: featured
          ? "rgba(255, 255, 255, 0.18)"
          : Palette.surfaceSunken,
      }}
    >
      {player ? <PlayerAvatar player={player} size={24} /> : null}
      <Text
        numberOfLines={1}
        tone={featured ? "onAccent" : "ink"}
        variant="caption"
      >
        {scorer.displayName}
        {scorer.goals > 1 ? ` ×${scorer.goals}` : ""}
      </Text>
    </View>
  );
}

/**
 * El hueco de una tarjeta de partido: fecha, marcador y una fila de
 * goleadores. Se dibuja con el molde del duelo —el caso normal— porque hasta
 * que llega el dato no se sabe cuántos equipos jugaron.
 */
export function MatchCardSkeleton({
  showDate = false,
}: {
  showDate?: boolean;
}) {
  return (
    <Surface padded={false} style={{ overflow: "hidden" }}>
      <View style={{ gap: Spacing.three, padding: Spacing.four }}>
        {showDate ? <Skeleton height={12} width={96} /> : null}

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: Spacing.three,
          }}
        >
          <Skeleton height={20} width="28%" />
          <Skeleton height={30} width={64} />
          <Skeleton height={20} width="28%" />
        </View>

        <View style={{ height: 1, backgroundColor: Palette.hairline }} />

        <View style={{ flexDirection: "row", gap: Spacing.two }}>
          <Skeleton height={30} radius={Radius.pill} width={104} />
          <Skeleton height={30} radius={Radius.pill} width={88} />
        </View>
      </View>
    </Surface>
  );
}
