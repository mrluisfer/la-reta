import { Pressable, View } from "react-native";

import { PlayerAvatar } from "@/components/player-avatar";
import { Icon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { Palette, Spacing } from "@/constants/theme";
import { formatPositions } from "@/lib/players";
import type { Player } from "@/lib/types";

/**
 * Fila de jugador con retrato, para rankings y listas cortas.
 *
 * El número de orden va en cifra tabular y ancho fijo para que la columna de
 * caras arranque en el mismo sitio en la fila 1 y en la 10.
 */
export function PlayerRow({
  player,
  rank,
  onPress,
}: {
  player: Player;
  rank: number;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole={onPress ? "button" : undefined}
      disabled={onPress === undefined}
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: Spacing.three,
          paddingVertical: Spacing.two,
          borderBottomWidth: 1,
          borderBottomColor: Palette.hairline,
        }}
      >
        <Text
          style={{ width: 22, textAlign: "right" }}
          tone="faint"
          variant="statSmall"
        >
          {rank}
        </Text>

        <PlayerAvatar player={player} size={40} />

        <View style={{ flex: 1, gap: Spacing.half }}>
          <Text numberOfLines={1} selectable variant="bodyStrong">
            {player.displayName}
          </Text>
          <Text numberOfLines={1} tone="muted" variant="caption">
            {formatPositions(player)} · {player.age} años
          </Text>
        </View>

        <Text tone="accent" variant="statSmall">
          {player.overall}
        </Text>

        {onPress ? (
          <Icon color={Palette.inkFaint} name="chevron" size={14} />
        ) : null}
      </View>
    </Pressable>
  );
}

/** El hueco de una fila, con los mismos altos para que nada salte al llegar. */
export function PlayerRowSkeleton() {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.three,
        paddingVertical: Spacing.two,
        borderBottomWidth: 1,
        borderBottomColor: Palette.hairline,
      }}
    >
      <Skeleton height={20} width={22} />
      <Skeleton height={40} radius={20} width={40} />
      <View style={{ flex: 1, gap: Spacing.two }}>
        <Skeleton height={16} width="58%" />
        <Skeleton height={12} width="34%" />
      </View>
      <Skeleton height={20} width={26} />
    </View>
  );
}
