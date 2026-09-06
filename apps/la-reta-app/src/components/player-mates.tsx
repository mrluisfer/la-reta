import { Pressable, View } from "react-native";

import { PlayerAvatar } from "@/components/player-avatar";
import { Icon } from "@/components/ui/icon";
import { Surface } from "@/components/ui/surface";
import { Text } from "@/components/ui/text";
import { Palette, Radius, Spacing } from "@/constants/theme";
import type { Teammate } from "@/lib/players";
import type { Player } from "@/lib/types";

/**
 * Con quién le toca jugar.
 *
 * No es un dato nuevo de la base: sale de cruzar el acta consigo misma, mismo
 * partido y misma letra de equipo. Pero es de lo primero que se pregunta —"¿con
 * quién te tocó?"— y hasta ahora había que reconstruirlo de memoria.
 *
 * Cada fila lleva su balance juntos, que es lo que convierte una lista de
 * nombres en algo discutible: dos que ganan cuatro de cinco veces juntos son
 * una sociedad, y eso el reparto de equipos no lo mira.
 */
export function TeammateList({
  mates,
  players,
  onOpen,
}: {
  mates: Teammate[];
  players: Player[] | null;
  onOpen: (playerId: number) => void;
}) {
  if (mates.length === 0) {
    return (
      <Text tone="faint" variant="caption">
        Todavía no ha coincidido con nadie el número suficiente de veces.
      </Text>
    );
  }

  return (
    <Surface padded={false} style={{ paddingHorizontal: Spacing.three }}>
      {mates.map((mate, index) => (
        <MateRow
          key={mate.playerId}
          last={index === mates.length - 1}
          mate={mate}
          onPress={() => onOpen(mate.playerId)}
          player={players?.find((item) => item.id === mate.playerId) ?? null}
        />
      ))}
    </Surface>
  );
}

function MateRow({
  mate,
  player,
  last,
  onPress,
}: {
  mate: Teammate;
  player: Player | null;
  last: boolean;
  onPress: () => void;
}) {
  const lost = mate.together - mate.won;

  return (
    <Pressable
      accessibilityLabel={`Abrir la ficha de ${mate.name}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: Spacing.three,
          paddingVertical: Spacing.three,
          borderBottomWidth: last ? 0 : 1,
          borderBottomColor: Palette.hairline,
        }}
      >
        {player === null ? (
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: Radius.pill,
              backgroundColor: Palette.surfaceSunken,
            }}
          />
        ) : (
          <PlayerAvatar player={player} size={38} />
        )}

        <View style={{ flex: 1, gap: Spacing.half }}>
          <Text numberOfLines={1} variant="bodyStrong">
            {mate.name}
          </Text>
          <Text tone="muted" variant="caption">
            {mate.together === 1
              ? "Coincidieron una vez"
              : `Coincidieron ${mate.together} veces`}
          </Text>
        </View>

        <View style={{ alignItems: "flex-end", gap: Spacing.half }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "baseline",
              gap: Spacing.half,
            }}
          >
            {/* "2 de 3" y no "2–1": lo que se pregunta de una pareja es cuántas
                veces de las que jugaron juntos ganaron, y un marcador con guion
                se lee como el resultado de un partido. */}
            <Text
              style={{ color: mate.won > lost ? Palette.accent : Palette.ink }}
              variant="statSmall"
            >
              {mate.won}
            </Text>
            <Text tone="faint" variant="caption">
              de {mate.together}
            </Text>
          </View>
          <Text tone="faint" variant="eyebrow">
            Ganados
          </Text>
        </View>

        <Icon color={Palette.inkFaint} name="chevron" size={14} />
      </View>
    </Pressable>
  );
}
