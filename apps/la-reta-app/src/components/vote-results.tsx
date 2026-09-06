import { Pressable, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

import { PlayerAvatar } from "@/components/player-avatar";
import { Icon, type IconName } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { Palette, Spacing } from "@/constants/theme";
import type { Player, VoteCategory, VoteTally } from "@/lib/types";

/**
 * Lo que votó la banda después del partido: figura, golazo y blooper.
 *
 * **En tres columnas, no en tres filas.** Cada premio es un nombre y una
 * proporción; puestos en fila ocupaban tres renglones enteros para tres datos
 * pequeños, y el ancho del móvil se quedaba vacío a la derecha. En columnas los
 * tres se comparan de una mirada, que es justo lo que se hace con un palmarés.
 *
 * La proporción de votos es el aro alrededor de la cara. Un aro es la forma
 * natural de "cuánto de un total" y, pegado al retrato, no gasta ni un renglón
 * más: el "3 de 6" que va debajo es para quien quiera la cifra exacta.
 *
 * El color solo vive en el aro, el icono y la etiqueta. La versión anterior
 * teñía la fila entera de ámbar, verde y rojo, y tres bloques pastel apilados
 * son exactamente lo que hace que una pantalla parezca una plantilla.
 *
 * **La columna entera lleva a su ficha**, no solo el nombre: el retrato es lo
 * más grande y lo primero a lo que va el pulgar. Aquí no hace falta caja para
 * separar los destinos —son tres columnas con su propio aire— y ponerla
 * encajonaría tres aros que se sostienen solos.
 */

const CATEGORIES: {
  key: VoteCategory;
  label: string;
  icon: IconName;
  color: string;
}[] = [
  { key: "figura", label: "Figura", icon: "star-fill", color: Palette.star },
  { key: "gol", label: "Golazo", icon: "ball", color: Palette.accent },
  { key: "error", label: "Blooper", icon: "flame", color: Palette.danger },
];

/** Lado del retrato con su aro, en puntos. */
const RING = 62;
const RING_WIDTH = 3;

export function VoteResults({
  tally,
  players,
  onOpenPlayer,
}: {
  tally: VoteTally[] | null;
  /** Roster para poner cara al más votado; los invitados van con iniciales. */
  players?: Player[] | null;
  /** Abre la ficha del premiado. Los invitados no la tienen. */
  onOpenPlayer: (playerId: number) => void;
}) {
  const results = CATEGORIES.map((category) => {
    const rows = (tally ?? []).filter((row) => row.category === category.key);
    if (rows.length === 0) return null;

    const total = rows.reduce((sum, row) => sum + row.count, 0);
    const winner = rows.reduce((best, row) =>
      row.count > best.count ? row : best
    );
    const player = players?.find((item) => item.id === winner.playerId) ?? null;

    return {
      ...category,
      total,
      count: winner.count,
      // El recuento trae el nombre del registro ("Paulo César Herrejón
      // Chávez") y no cabe en una columna; si está en el roster gana su nombre
      // de carta, que es como se le dice de verdad.
      name: player?.displayName ?? winner.name,
      player,
    };
  }).filter((entry) => entry !== null);

  if (results.length === 0) return null;

  return (
    <View style={{ flexDirection: "row", gap: Spacing.two }}>
      {results.map((entry) => (
        <Pressable
          accessibilityLabel={
            entry.player === null
              ? undefined
              : `Abrir la ficha de ${entry.name}`
          }
          accessibilityRole={entry.player === null ? undefined : "button"}
          disabled={entry.player === null}
          key={entry.key}
          onPress={() => entry.player && onOpenPlayer(entry.player.id)}
          style={({ pressed }) => ({
            flex: 1,
            alignItems: "center",
            gap: Spacing.two,
            paddingVertical: Spacing.two,
            opacity: pressed ? 0.55 : 1,
          })}
        >
          <Portrait
            color={entry.color}
            name={entry.name}
            player={entry.player}
            share={entry.total === 0 ? 0 : entry.count / entry.total}
          />

          <View style={{ alignItems: "center", gap: Spacing.half }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: Spacing.one,
              }}
            >
              <Icon
                color={entry.color}
                name={entry.icon}
                size={12}
                strokeWidth={2}
              />
              <Text style={{ color: entry.color }} variant="eyebrow">
                {entry.label}
              </Text>
            </View>

            <Text numberOfLines={1} variant="bodyStrong">
              {entry.name}
            </Text>
            <Text tone="faint" variant="caption">
              {entry.count} de {entry.total}
            </Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

/**
 * El retrato del más votado con su aro de proporción.
 *
 * El aro se dibuja con un círculo punteado al que se le deja fuera el tramo que
 * falta (`strokeDasharray` + `strokeDashoffset`), girado un cuarto de vuelta
 * para que empiece arriba. Es el truco de siempre y aquí no necesita más: son
 * tres aros quietos, no una gráfica que haya que animar.
 */
function Portrait({
  player,
  name,
  share,
  color,
}: {
  player: Player | null;
  name: string;
  share: number;
  color: string;
}) {
  const radius = (RING - RING_WIDTH) / 2;
  const circumference = 2 * Math.PI * radius;
  const inner = RING - RING_WIDTH * 4;

  return (
    <View
      style={{ width: RING, height: RING, alignItems: "center", justifyContent: "center" }}
    >
      <Svg height={RING} style={{ position: "absolute" }} width={RING}>
        <Circle
          cx={RING / 2}
          cy={RING / 2}
          fill="none"
          r={radius}
          stroke={Palette.surfaceSunken}
          strokeWidth={RING_WIDTH}
        />
        <Circle
          cx={RING / 2}
          cy={RING / 2}
          fill="none"
          origin={`${RING / 2}, ${RING / 2}`}
          r={radius}
          rotation={-90}
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - Math.min(share, 1))}
          strokeLinecap="round"
          strokeWidth={RING_WIDTH}
        />
      </Svg>

      {player ? (
        <PlayerAvatar player={player} size={inner} />
      ) : (
        <View
          style={{
            width: inner,
            height: inner,
            borderRadius: inner / 2,
            backgroundColor: Palette.surfaceSunken,
            borderWidth: 1,
            borderColor: Palette.line,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text tone="faint" variant="caption">
            {name.slice(0, 2).toUpperCase()}
          </Text>
        </View>
      )}
    </View>
  );
}
