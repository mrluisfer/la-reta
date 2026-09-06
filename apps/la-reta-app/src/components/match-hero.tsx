import { View } from "react-native";

import { MatchPhoto } from "@/components/match-photo";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { Display, Palette, Radius, Spacing } from "@/constants/theme";
import { formatMatchDate } from "@/lib/dates";
import {
  formatDuration,
  rankedTeams,
  teamColor,
  type RankedTeam,
} from "@/lib/teams";
import type { Match } from "@/lib/types";

/**
 * El resultado, en el lenguaje del resto de la app: papel, filetes y cifras
 * grandes en Oswald.
 *
 * Hubo una versión anterior con tarjeta oscura, degradado y una barra de
 * colores por equipo. Se veía como cualquier plantilla: la app había pasado de
 * un acento a ocho colores y perdido lo que la distinguía. Aquí el color de
 * equipo se queda en un filete de 3 pt —identifica sin decorar— y el peso lo
 * lleva la tipografía, igual que en la tira de cifras de Inicio. Ese filete es
 * además el que amarra cada fila con su bloque de goleadores más abajo, que
 * usa el mismo color: en una reta de tres es lo único que dice de qué equipo
 * era el que marcó.
 *
 * Con tres o más equipos esto es una tabla, así que lleva puesto. Y quien ganó
 * se marca con tinta plena, con una copa pequeña al lado; los demás quedan en
 * gris. La copa es la única concesión: en un empate arriba marca a los dos, que
 * es algo que el puesto solo no sabe decir.
 *
 * La foto abre la ficha, entera y con su proporción —aquí no es un adorno de
 * cabecera sino el documento del partido, y recortarla a una franja para que
 * cuadre sería tirar justo lo que se vino a ver—. Va debajo el marcador, sin
 * nada escrito encima de la imagen: el degradado oscuro con la cifra grande
 * superpuesta es exactamente la plantilla que esta pantalla ya descartó una
 * vez.
 */
export function MatchHero({ match }: { match: Match }) {
  const ranked = rankedTeams(match);
  /** Un duelo no necesita tabla: con dos filas el orden ya es el puesto. */
  const showRank = ranked.length > 2;
  const shared = ranked.filter((team) => team.isWinner).length > 1;
  const duration = formatDuration(match.durationSec);

  return (
    <View style={{ gap: Spacing.three }}>
      <MatchPhoto
        alt={`Foto del partido del ${formatMatchDate(match.playedAt)}`}
        mode="full"
        radius={Radius.lg}
        url={match.photoUrl}
      />

      <Text tone="muted" variant="eyebrow">
        {formatMatchDate(match.playedAt)}
        {duration === null ? "" : ` · ${duration}`}
        {shared ? " · Empate arriba" : ""}
      </Text>

      <View style={{ borderTopWidth: 1, borderTopColor: Palette.hairline }}>
        {ranked.map((team) => (
          <TeamRow key={team.key} showRank={showRank} team={team} />
        ))}
      </View>

    </View>
  );
}

function TeamRow({ team, showRank }: { team: RankedTeam; showRank: boolean }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.three,
        paddingVertical: Spacing.three,
        borderBottomWidth: 1,
        borderBottomColor: Palette.hairline,
      }}
    >
      {showRank ? (
        <Text style={{ width: 14 }} tone="faint" variant="eyebrow">
          {team.rank}
        </Text>
      ) : null}

      <View
        style={{
          width: 3,
          height: 30,
          borderRadius: 2,
          backgroundColor: teamColor(team.key),
        }}
      />

      <Text
        numberOfLines={1}
        style={{ flexShrink: 1 }}
        tone={team.isWinner ? "ink" : "muted"}
        variant="bodyStrong"
      >
        {team.name}
      </Text>

      <View style={{ flex: 1, paddingLeft: Spacing.two }}>
        {team.isWinner ? (
          <Icon color={Palette.star} name="trophy" size={15} strokeWidth={2} />
        ) : null}
      </View>

      <Text
        style={{
          color: team.isWinner ? Palette.ink : Palette.inkFaint,
          fontFamily: Display.bold,
          fontSize: 40,
          lineHeight: 48,
          fontVariant: ["tabular-nums"],
        }}
      >
        {team.score}
      </Text>
    </View>
  );
}
