import { Pressable, View } from "react-native";

import { PlayerAvatar } from "@/components/player-avatar";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { Palette, Radius, Spacing } from "@/constants/theme";
import { isGuest } from "@/lib/guests";
import type { Player } from "@/lib/types";

/**
 * La plantilla como rejilla de fichas que se tocan para convocar.
 *
 * En lista, marcar a doce de diecinueve era doce viajes del pulgar por una
 * columna de filas idénticas, mirando una casilla de 24 pt en el margen. En
 * rejilla la ficha entera es el objetivo, caben nueve de un vistazo y el estado
 * lo lleva la tarjeta —verde llena o papel— en vez de un cuadrito.
 *
 * Tres columnas y no dos: con dos, diecinueve jugadores son diez filas y vuelve
 * a haber scroll para ver a quién falta; con cuatro, el nombre se parte.
 *
 * Dentro de la ficha manda el retrato. Con la cara a 44 pt sobraba papel por
 * todos lados y quien busca a alguien acababa leyendo diecinueve nombres en
 * gris; a 64 se reconoce a la gente de un vistazo, que es como se convoca de
 * verdad. El nombre queda debajo, de pie de foto, y el relleno baja a lo justo
 * para separar del filete.
 */

const COLUMNS = 3;
/**
 * Hueco entre fichas, en puntos.
 *
 * No es el `gap` del contenedor a propósito: con `gap` y anchos en porcentaje,
 * tres fichas del 33.3% más dos huecos suman más del 100% y la tercera se cae a
 * la fila siguiente —eran dos columnas donde tenía que haber tres—. Repartido
 * como relleno dentro de cada celda, el ancho sigue siendo exacto.
 */
const GUTTER = Spacing.two;

/**
 * Lado del retrato, en puntos. Es lo que llena la ficha: con tres columnas en
 * un iPhone la celda mide unos 110, así que 64 deja el aire justo a los lados
 * sin que la cara toque el filete.
 */
const AVATAR = 64;
/** Chapa del check, proporcional al retrato. */
const CHECK = 22;

export function CallupGrid({
  players,
  called,
  onToggle,
}: {
  players: Player[];
  called: Set<number>;
  onToggle: (id: number) => void;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        // Compensa el relleno de las celdas para que la rejilla siga alineada
        // con el resto de la pantalla.
        margin: -GUTTER / 2,
      }}
    >
      {players.map((player) => (
        <CallupCard
          called={called.has(player.id)}
          key={player.id}
          onPress={() => onToggle(player.id)}
          player={player}
        />
      ))}
    </View>
  );
}

function CallupCard({
  player,
  called,
  onPress,
}: {
  player: Player;
  called: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={`${called ? "Desconvocar" : "Convocar"} a ${player.displayName}`}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: called }}
      onPress={onPress}
      style={({ pressed }) => ({
        width: `${100 / COLUMNS}%`,
        padding: GUTTER / 2,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <View
        style={{
          alignItems: "center",
          gap: Spacing.one,
          paddingVertical: Spacing.two,
          paddingHorizontal: Spacing.one,
          borderRadius: Radius.md,
          borderCurve: "continuous",
          borderWidth: 1,
          borderColor: called ? Palette.accent : Palette.line,
          backgroundColor: called ? Palette.accentSoft : Palette.surface,
        }}
      >
        <View>
          <PlayerAvatar player={player} size={AVATAR} />

          {called ? (
            <View
              style={{
                position: "absolute",
                right: -2,
                bottom: -2,
                width: CHECK,
                height: CHECK,
                borderRadius: Radius.pill,
                backgroundColor: Palette.accent,
                borderWidth: 2,
                borderColor: Palette.surface,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon
                color={Palette.accentInk}
                name="check"
                size={12}
                strokeWidth={2.6}
              />
            </View>
          ) : null}
        </View>

        <Text
          numberOfLines={1}
          style={{ maxWidth: "100%", marginTop: Spacing.one }}
          tone={called ? "ink" : "muted"}
          variant="caption"
        >
          {player.displayName}
        </Text>

        <Text tone={called ? "accent" : "faint"} variant="eyebrow">
          {isGuest(player) ? `INV · ${player.overall}` : player.overall}
        </Text>
      </View>
    </Pressable>
  );
}
