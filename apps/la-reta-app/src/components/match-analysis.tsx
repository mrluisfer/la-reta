import { View } from "react-native";
import Svg, { Line, Polygon } from "react-native-svg";
import { CartesianChart, HorizontalBar } from "victory-native";

import { Text } from "@/components/ui/text";
import { Motion, Palette, Radius, Spacing } from "@/constants/theme";
import { useChartFont } from "@/hooks/use-chart-font";
import {
  contributions,
  LINES,
  lineGrid,
  type TeamProfile,
} from "@/lib/match-analysis";
import { GROUP_SHORT } from "@/lib/players";
import { isTeamKey, TEAM_KEYS, teamColor, type TeamKey } from "@/lib/teams";
import { STAT_ABBR, STAT_KEYS, type Match, type Player } from "@/lib/types";

/** Skia parsea color CSS pero no la palabra `transparent`. */
const TRANSPARENT = "rgba(0, 0, 0, 0)";
const RINGS = [0.33, 0.66, 1];
/** Aire a cada lado del recorrido, en puntos de atributo. */
const RADAR_PADDING = 6;
/** Suelo del polígono: sin esto el peor de un eje se clava en el centro. */
const RADAR_FLOOR = 0.14;

/**
 * El perfil de cada equipo, superpuesto en un hexágono.
 *
 * Es el mismo dibujo que la ficha de jugador, aplicado a un equipo entero: la
 * media de sus seis atributos. Y contesta lo que el marcador no dice —de qué
 * iba cada equipo—: uno rápido y flojo atrás y otro lento y sólido se
 * reconocen por la silueta antes de leer una cifra, y explican un 8–1 mucho
 * mejor que la diferencia de overall, que el repartidor deja casi a cero.
 *
 * Sin cifras en los vértices, al revés que en la ficha de jugador. Ahí hay una
 * silueta y las seis caben; aquí hay tres y dieciocho números convertirían el
 * hexágono en una tabla mal puesta. La leyenda de abajo lleva el overall medio,
 * que es el número que sí se compara.
 *
 * **La escala se ciñe a este partido**, no va de 0 a 100. Las medias de tres
 * equipos repartidos por el balanceador caen todas entre 35 y 60: sobre la
 * escala entera salían tres hexágonos calcados en el centro del dibujo, que es
 * lo mismo que no dibujar nada. Ceñida, la diferencia real —dónde uno saca
 * cinco puntos al otro— se ve. Por eso no hay números en los anillos: esto
 * compara equipos entre sí, no contra una referencia absoluta.
 */
export function TeamRadar({
  profiles,
  size = 260,
}: {
  profiles: TeamProfile[];
  size?: number;
}) {
  const center = size / 2;
  const radius = center * 0.66;

  const values = profiles.flatMap((profile) =>
    STAT_KEYS.map((key) => profile.stats[key])
  );
  const floor = Math.min(...values) - RADAR_PADDING;
  const ceiling = Math.max(...values) + RADAR_PADDING;
  const span = Math.max(ceiling - floor, 1);
  const ratioOf = (value: number) =>
    RADAR_FLOOR + ((value - floor) / span) * (1 - RADAR_FLOOR);

  const pointAt = (index: number, ratio: number) => {
    const angle = ((-90 + index * (360 / STAT_KEYS.length)) * Math.PI) / 180;
    return {
      x: center + Math.cos(angle) * radius * ratio,
      y: center + Math.sin(angle) * radius * ratio,
    };
  };

  const ringPoints = (ratio: number) =>
    STAT_KEYS.map((_, index) => {
      const { x, y } = pointAt(index, ratio);
      return `${x},${y}`;
    }).join(" ");

  return (
    <View style={{ alignItems: "center", gap: Spacing.three }}>
      <View style={{ width: size, height: size }}>
        <Svg height={size} width={size}>
          {RINGS.map((ring) => (
            <Polygon
              fill="none"
              key={ring}
              points={ringPoints(ring)}
              stroke={Palette.line}
              strokeWidth={1}
            />
          ))}

          {STAT_KEYS.map((key, index) => {
            const { x, y } = pointAt(index, 1);
            return (
              <Line
                key={key}
                stroke={Palette.line}
                strokeWidth={1}
                x1={center}
                x2={x}
                y1={center}
                y2={y}
              />
            );
          })}

          {profiles.map((profile) => {
            const points = STAT_KEYS.map((key, index) => {
              const { x, y } = pointAt(index, ratioOf(profile.stats[key]));
              return `${x},${y}`;
            }).join(" ");

            return (
              <Polygon
                fill={profile.color}
                // Muy translúcido a propósito: con tres siluetas encima, un
                // relleno normal esconde a las de abajo y el dibujo deja de
                // poder leerse como comparación.
                fillOpacity={0.12}
                key={profile.key}
                points={points}
                stroke={profile.color}
                strokeLinejoin="round"
                strokeWidth={2}
              />
            );
          })}
        </Svg>

        {/* Las etiquetas van en vistas y no en <Text> de SVG: así heredan la
            tipografía del resto de la app. */}
        {STAT_KEYS.map((key, index) => {
          const { x, y } = pointAt(index, 1.26);
          return (
            <View
              key={key}
              style={{
                position: "absolute",
                left: x - 22,
                top: y - 8,
                width: 44,
                alignItems: "center",
              }}
            >
              <Text tone="faint" variant="eyebrow">
                {STAT_ABBR[key]}
              </Text>
            </View>
          );
        })}
      </View>

      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: Spacing.three,
        }}
      >
        {profiles.map((profile) => (
          <View
            key={profile.key}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: Spacing.two,
            }}
          >
            <View
              style={{
                width: 14,
                height: 3,
                borderRadius: 2,
                backgroundColor: profile.color,
              }}
            />
            <Text numberOfLines={1} tone="muted" variant="caption">
              {profile.name}
            </Text>
            <Text variant="caption">{profile.overall}</Text>
          </View>
        ))}
      </View>

      <Text style={{ textAlign: "center" }} tone="faint" variant="caption">
        La escala se ajusta a este partido: lo que se compara es un equipo con
        otro, no con la liga.
      </Text>
    </View>
  );
}

/** Alto por barra, más el sitio del eje. */
const ROW_HEIGHT = 30;
const AXIS_HEIGHT = 26;

/**
 * Una fila de la gráfica de aportación.
 *
 * Se declara como `type` y no como `interface` a propósito: `CartesianChart`
 * exige `Record<string, unknown>` y una interfaz no lo satisface, porque TS
 * solo le da firma de índice implícita a los alias.
 */
type ContributionRow = { label: string } & Record<TeamKey, number | null>;

/**
 * Quién estuvo metido en los goles, en barras del color de su equipo.
 *
 * La lista de goleadores de arriba está agrupada por equipo, así que responde
 * "¿quién marcó para los míos?". Esto responde la otra: **quién mandó en el
 * partido**, sin importar la camiseta. Un 4 y un 2 se leen igual en dos listas
 * separadas; puestos en la misma escala, la distancia se ve.
 *
 * Una serie por equipo, con huecos en las filas ajenas: es la única forma de
 * que cada barra lleve su color, porque una serie se pinta de un color. Es el
 * mismo truco con el que la portada destaca la última jornada.
 */
export function ContributionChart({
  match,
  size = 8,
}: {
  match: Match;
  /** Cuántos aportadores entran. Más de ocho ya no es una comparación. */
  size?: number;
}) {
  const entries = contributions(match, size);
  const font = useChartFont(11);

  if (entries.length === 0) {
    return (
      <Text tone="faint" variant="caption">
        Nadie participó en un gol en este partido.
      </Text>
    );
  }

  // Una fila lleva **todas** las letras, con `null` en las que no son suyas.
  // La gráfica exige que las claves de serie sean conocidas de antemano, así
  // que se declara el juego entero y se pintan solo las que aparecen.
  const teams = [...new Set(entries.map((entry) => entry.team))].filter(
    isTeamKey
  );
  const data: ContributionRow[] = entries.map((entry) => {
    const row = { label: entry.label } as ContributionRow;
    for (const key of TEAM_KEYS) {
      row[key] = entry.team === key ? entry.total : null;
    }
    return row;
  });

  return (
    <View style={{ height: entries.length * ROW_HEIGHT + AXIS_HEIGHT }}>
      <CartesianChart
        data={data}
        // Desde cero: una barra vale lo que mide, y con el suelo pegado al
        // mínimo el que menos aportó se queda sin barra.
        domain={{ y: [0, Math.max(...entries.map((entry) => entry.total))] }}
        domainPadding={{ top: 12, bottom: 12, right: 16 }}
        orientation="horizontal"
        // En horizontal los papeles se cambian: el eje X lleva la aportación y
        // el Y los nombres. Con `Bar` en vez de `HorizontalBar` la gráfica sale
        // vertical y los ejes se calculan sobre la escala equivocada.
        xAxis={{
          font,
          labelColor: Palette.inkFaint,
          lineColor: Palette.line,
          tickCount: 4,
          formatXLabel: (value) => String(Math.round(Number(value))),
        }}
        xKey="label"
        yAxis={[
          {
            font,
            labelColor: Palette.inkMuted,
            lineColor: TRANSPARENT,
            // Un nombre por barra. Sin esto la gráfica elige unas cuantas
            // marcas y deja filas sin etiquetar, que en una comparación entre
            // personas es lo único que no se puede omitir.
            tickCount: entries.length,
          },
        ]}
        yKeys={teams}
      >
        {({ points, chartBounds }) => (
          <>
            {teams.map((team) => (
              <HorizontalBar
                animate={{ type: "timing", duration: Motion.slow }}
                barCount={entries.length}
                chartBounds={chartBounds}
                color={teamColor(team)}
                key={team}
                points={points[team]}
                roundedCorners={{ topRight: 6, bottomRight: 6 }}
              />
            ))}
          </>
        )}
      </CartesianChart>
    </View>
  );
}

/**
 * Cómo estaba armado cada equipo, en cuadrícula de calor.
 *
 * El repartidor equilibra por overall, no por puestos, así que dos equipos con
 * la misma media pueden salir uno con tres porteros y otro sin ninguno. Ahí
 * está la mitad de las palizas de la reta, y hasta ahora no había forma de
 * verlo.
 *
 * La intensidad de cada celda es su cuenta contra la mayor de la cuadrícula, no
 * contra un tope fijo: lo que se compara es un equipo con otro, y una escala
 * absoluta dejaría todo en el mismo tono pálido.
 */
export function LineHeatmap({
  match,
  players,
}: {
  match: Match;
  players: Player[] | null;
}) {
  const rows = lineGrid(match, players);
  if (rows.length === 0) return null;

  const peak = Math.max(
    1,
    ...rows.flatMap((row) => LINES.map((line) => row.counts[line]))
  );

  return (
    <View style={{ gap: Spacing.two }}>
      <View style={{ flexDirection: "row", gap: Spacing.one }}>
        <View style={{ width: 92 }} />
        {LINES.map((line) => (
          <View key={line} style={{ flex: 1, alignItems: "center" }}>
            <Text tone="faint" variant="eyebrow">
              {GROUP_SHORT[line]}
            </Text>
          </View>
        ))}
      </View>

      {rows.map((row) => (
        <View
          key={row.key}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: Spacing.one,
          }}
        >
          <View
            style={{
              width: 92,
              flexDirection: "row",
              alignItems: "center",
              gap: Spacing.two,
            }}
          >
            <View
              style={{
                width: 3,
                height: 14,
                borderRadius: 2,
                backgroundColor: row.color,
              }}
            />
            <Text numberOfLines={1} style={{ flex: 1 }} variant="caption">
              {row.name}
            </Text>
          </View>

          {LINES.map((line) => {
            const count = row.counts[line];
            return (
              <View
                key={line}
                style={{
                  flex: 1,
                  height: 38,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: Radius.sm,
                  borderCurve: "continuous",
                  backgroundColor:
                    count === 0 ? Palette.surfaceSunken : row.color,
                  opacity: count === 0 ? 1 : 0.2 + (count / peak) * 0.8,
                }}
              >
                <Text
                  style={{
                    color: count === 0 ? Palette.inkFaint : Palette.surface,
                  }}
                  variant="caption"
                >
                  {count}
                </Text>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}
