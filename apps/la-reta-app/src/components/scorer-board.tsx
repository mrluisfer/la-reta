import { Pressable, View } from "react-native";

import { PlayerAvatar } from "@/components/player-avatar";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { Palette, Radius, Spacing } from "@/constants/theme";
import { matchTeams, teamColor } from "@/lib/teams";
import type { Match, Player, Scorer } from "@/lib/types";

/**
 * Quién marcó, agrupado por equipo.
 *
 * Es la parte de la ficha que más se mira: el marcador dice cómo quedó, esto
 * dice quién lo hizo.
 *
 * **En dos columnas.** Una fila por goleador gastaba el ancho entero del móvil
 * para una cara, un nombre corto y un "×2", y en una reta de tres equipos eso
 * son tres bloques que no caben juntos en pantalla. Con dos columnas cada
 * bloque mide la mitad y los tres equipos se ven de una vez, que es cuando la
 * comparación entre ellos significa algo.
 *
 * **El máximo goleador del partido lleva una copa.** No es un adorno: en una
 * reta de tres equipos las listas van separadas por bloque, así que el que más
 * metió puede estar en el segundo bloque y perderse. La copa lo saca de ahí sin
 * romper el orden por equipos.
 *
 * Las asistencias van en su propia pastilla con la flecha, no diluidas en una
 * línea de texto: son el otro número del acta y merecen leerse como un número.
 *
 * **Cada celda lleva a su ficha.** Y es una celda con fondo propio, no una fila
 * suelta: en una rejilla de dos columnas hacen falta bordes visibles para que
 * el pulgar sepa dónde acaba un jugador y empieza el de al lado —tocar a
 * PADRINO queriendo tocar a ABARCA es el error fácil aquí—. La caja también es
 * lo que dice que hay algo que tocar antes de tocarlo, que en una lista de
 * nombres no se da por hecho.
 *
 * Los invitados no llevan caja pulsable: no tienen ficha a la que ir.
 */
export function ScorerBoard({
  match,
  players,
  onOpenPlayer,
}: {
  match: Match;
  players: Player[] | null;
  /** Abre la ficha del goleador. Los invitados no la tienen. */
  onOpenPlayer: (playerId: number) => void;
}) {
  const best = Math.max(0, ...match.scorers.map((scorer) => scorer.goals));

  const blocks = matchTeams(match)
    .map((team) => ({
      team,
      scorers: match.scorers
        .filter((scorer) => scorer.team === team.key && scorer.goals > 0)
        .sort((a, b) => b.goals - a.goals),
    }))
    .filter((block) => block.scorers.length > 0);

  if (blocks.length === 0) {
    return (
      <Text tone="faint" variant="caption">
        Nadie registró goles en este partido.
      </Text>
    );
  }

  return (
    <View style={{ gap: Spacing.four }}>
      {blocks.map((block) => (
        <View key={block.team.key} style={{ gap: Spacing.one }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: Spacing.two,
              paddingBottom: Spacing.one,
            }}
          >
            <View
              style={{
                width: 3,
                height: 12,
                borderRadius: 2,
                backgroundColor: teamColor(block.team.key),
              }}
            />
            <Text style={{ flex: 1 }} tone="muted" variant="eyebrow">
              {block.team.name}
            </Text>
            <Text tone="faint" variant="eyebrow">
              {block.team.score} {block.team.score === 1 ? "gol" : "goles"}
            </Text>
          </View>

          <View
            // El aire entre celdas lo pone el relleno de cada hueco, no un
            // `gap`: con `gap` los dos huecos del 50 % ya no caben en una fila
            // y la rejilla se rompe a una columna.
            style={{ flexDirection: "row", flexWrap: "wrap" }}
          >
            {block.scorers.map((scorer) => (
              <ScorerCell
                // Con un solo goleador destacado la copa marca al máximo del
                // partido; si varios empatan arriba, los marca a todos.
                isTop={scorer.goals === best}
                key={`${scorer.playerId ?? "g"}-${scorer.displayName}`}
                onOpen={onOpenPlayer}
                player={
                  players?.find((item) => item.id === scorer.playerId) ?? null
                }
                scorer={scorer}
              />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

/**
 * Un goleador. Media fila de ancho, con la cara, el nombre y sus goles.
 *
 * La celda vive dentro de un hueco del 50 % con su relleno, y no ocupa el 50 %
 * ella misma: así el aire entre celdas es de verdad —no toca dos cajas
 * pegadas— y cada zona pulsable queda separada de la de al lado.
 *
 * Los apuntes —asistencias, invitado— van debajo en pastilla y no en la misma
 * línea: en media pantalla no caben al lado del nombre sin recortarlo, y el
 * nombre es lo que se viene a leer.
 */
function ScorerCell({
  scorer,
  player,
  isTop,
  onOpen,
}: {
  scorer: Scorer;
  player: Player | null;
  isTop: boolean;
  onOpen: (playerId: number) => void;
}) {
  const inner = (
    <>
      {player ? (
        <PlayerAvatar player={player} size={34} />
      ) : (
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            backgroundColor: Palette.surfaceSunken,
            borderWidth: 1,
            borderColor: Palette.line,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text tone="faint" variant="caption">
            {scorer.displayName.slice(0, 2).toUpperCase()}
          </Text>
        </View>
      )}

      <View style={{ flex: 1, gap: Spacing.half }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: Spacing.one,
          }}
        >
          <Text
            numberOfLines={1}
            style={{ flexShrink: 1 }}
            variant="bodyStrong"
          >
            {scorer.displayName}
          </Text>
          {isTop ? (
            <Icon color={Palette.star} name="trophy" size={12} strokeWidth={2} />
          ) : null}
        </View>

        {scorer.assists > 0 || scorer.isGuest ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: Spacing.one,
            }}
          >
            {scorer.assists > 0 ? (
              <Chip icon label={`${scorer.assists}`} />
            ) : null}
            {scorer.isGuest ? <Chip label="Invitado" /> : null}
          </View>
        ) : null}
      </View>

      <Text tone="accent" variant="statSmall">
        ×{scorer.goals}
      </Text>
    </>
  );

  const box = {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: Spacing.two,
    padding: Spacing.two,
    borderRadius: Radius.md,
    borderCurve: "continuous" as const,
    borderWidth: 1,
    borderColor: Palette.hairline,
    backgroundColor: Palette.surface,
  };

  return (
    <View style={{ width: "50%", padding: Spacing.one }}>
      {player === null ? (
        <View style={box}>{inner}</View>
      ) : (
        <Pressable
          accessibilityLabel={`Abrir la ficha de ${scorer.displayName}`}
          accessibilityRole="button"
          onPress={() => onOpen(player.id)}
          style={({ pressed }) => [
            box,
            pressed
              ? {
                  backgroundColor: Palette.surfaceSunken,
                  borderColor: Palette.line,
                }
              : null,
          ]}
        >
          {inner}
        </Pressable>
      )}
    </View>
  );
}

/** Apunte breve bajo el nombre: una asistencia, un invitado. */
function Chip({ label, icon = false }: { label: string; icon?: boolean }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.half,
        paddingHorizontal: Spacing.two,
        paddingVertical: 2,
        borderRadius: Radius.sm,
        borderCurve: "continuous",
        backgroundColor: Palette.surfaceSunken,
      }}
    >
      {icon ? (
        <Icon color={Palette.inkMuted} name="arrow" size={11} strokeWidth={2} />
      ) : null}
      <Text tone="muted" variant="caption">
        {label}
      </Text>
    </View>
  );
}
