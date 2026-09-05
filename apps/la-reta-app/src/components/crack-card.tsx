import { Pressable, View } from "react-native";

import { PlayerAvatar } from "@/components/player-avatar";
import { Icon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import { Surface } from "@/components/ui/surface";
import { Text } from "@/components/ui/text";
import { Palette, Spacing } from "@/constants/theme";
import { formatPositions } from "@/lib/players";
import { STAT_ABBR, STAT_KEYS, type Player } from "@/lib/types";

/**
 * El jugador de mayor overall, con su retrato y el hexágono de atributos
 * abierto en fila.
 *
 * Traslada la ficha FIFA de la web: la cara identifica antes que el nombre, el
 * OVR pesa a la derecha y los seis atributos van debajo en cifras tabulares
 * para que las columnas cuadren de una fila a otra.
 */
export function CrackCard({
  player,
  onPress,
}: {
  player: Player | null;
  onPress?: () => void;
}) {
  if (player === null) {
    return <CrackSkeleton />;
  }

  return (
    <Pressable
      accessibilityRole={onPress ? "button" : undefined}
      disabled={onPress === undefined}
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      <Surface style={{ gap: Spacing.three, padding: Spacing.four }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: Spacing.three,
          }}
        >
          <PlayerAvatar player={player} size={54} />

          <View style={{ flex: 1, gap: Spacing.one }}>
            <Text numberOfLines={1} selectable variant="title">
              {player.displayName}
            </Text>
            <Text tone="muted" variant="caption">
              {formatPositions(player)} · {player.age} años
            </Text>
          </View>

          <View style={{ alignItems: "flex-end" }}>
            <Text selectable tone="accent" variant="stat">
              {player.overall}
            </Text>
            <Text tone="faint" variant="eyebrow">
              OVR
            </Text>
          </View>

          {onPress ? (
            <Icon color={Palette.inkFaint} name="chevron" size={16} />
          ) : null}
        </View>

        <View style={{ height: 1, backgroundColor: Palette.hairline }} />

        <View style={{ flexDirection: "row" }}>
          {STAT_KEYS.map((key) => (
            <View
              key={key}
              style={{ flex: 1, alignItems: "center", gap: Spacing.half }}
            >
              <Text variant="statSmall">{player[key]}</Text>
              <Text tone="faint" variant="eyebrow">
                {STAT_ABBR[key]}
              </Text>
            </View>
          ))}
        </View>
      </Surface>
    </Pressable>
  );
}

function CrackSkeleton() {
  return (
    <Surface style={{ gap: Spacing.three, padding: Spacing.four }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: Spacing.three,
        }}
      >
        <Skeleton height={54} width={54} />
        <View style={{ flex: 1, gap: Spacing.two }}>
          <Skeleton height={22} width="62%" />
          <Skeleton height={13} width="40%" />
        </View>
        <Skeleton height={34} width={54} />
      </View>
      <View style={{ height: 1, backgroundColor: Palette.hairline }} />
      <View style={{ flexDirection: "row", gap: Spacing.two }}>
        {STAT_KEYS.map((key) => (
          <View key={key} style={{ flex: 1, alignItems: "center" }}>
            <Skeleton height={20} width="70%" />
          </View>
        ))}
      </View>
    </Surface>
  );
}
