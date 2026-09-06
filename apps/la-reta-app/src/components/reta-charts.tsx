import { View } from "react-native";
import {
  Area,
  CartesianChart,
  Line,
  Pie,
  PolarChart,
  Scatter,
} from "victory-native";

import { PlayerAvatar } from "@/components/player-avatar";
import { Text } from "@/components/ui/text";
import { Motion, Palette, Radius, Spacing } from "@/constants/theme";
import { useChartFont } from "@/hooks/use-chart-font";
import type {
  DiffPoint,
  FormatCount,
  PairStat,
  PlayerCount,
} from "@/lib/reta-stats";
import type { Player } from "@/lib/types";

/** Skia parsea color CSS pero no la palabra `transparent`. */
const TRANSPARENT = "rgba(0, 0, 0, 0)";
const TREND_HEIGHT = 160;
/** Con una sola generación no hay recorrido que dibujar. */
const MIN_POINTS = 2;
/** Aire arriba del recorrido, en puntos de diferencia. */
const PADDING = 2;
const DIAL = 140;

/**
 * Qué tan parejas van saliendo las retas.
 *
 * La `diff` de cada reparto es la distancia entre el equipo más fuerte y el más
 * débil, así que **abajo es mejor**: una línea que baja significa que el
 * repartidor está afinando. Es la única medida del historial que dice si la
 * herramienta funciona, y hasta ahora solo se veía en la web.
 *
 * El eje arranca en cero justamente por eso: la diferencia es una distancia, y
 * media escala recortada convertiría un 1,2 en algo que parece un desastre.
 */
export function BalanceTrend({ points }: { points: DiffPoint[] }) {
  const font = useChartFont(11);

  if (points.length < MIN_POINTS) {
    return (
      <Text tone="faint" variant="caption">
        Hacen falta al menos dos repartos para ver la tendencia.
      </Text>
    );
  }

  const peak = Math.max(...points.map((point) => point.diff)) + PADDING;

  return (
    <View style={{ height: TREND_HEIGHT }}>
      <CartesianChart
        data={points}
        domain={{ y: [0, peak] }}
        domainPadding={{ left: 20, right: 20, top: 12, bottom: 12 }}
        xAxis={{
          font,
          labelColor: Palette.inkFaint,
          lineColor: TRANSPARENT,
          // Solo los extremos: con veinte repartos, veinte fechas se pisan.
          tickValues: [0, points.length - 1],
          formatXLabel: (value) => points[Number(value)]?.label ?? "",
        }}
        xKey="step"
        yAxis={[
          {
            font,
            labelColor: Palette.inkFaint,
            lineColor: Palette.line,
            tickCount: 3,
            formatYLabel: (value) => String(Math.round(Number(value))),
          },
        ]}
        yKeys={["diff"]}
      >
        {({ points: drawn, chartBounds }) => (
          <>
            <Area
              animate={{ type: "timing", duration: Motion.slow }}
              color={Palette.accentSoft}
              curveType="monotoneX"
              points={drawn.diff}
              y0={chartBounds.bottom}
            />
            <Line
              animate={{ type: "timing", duration: Motion.slow }}
              color={Palette.accent}
              curveType="monotoneX"
              points={drawn.diff}
              strokeWidth={2.5}
            />
            <Scatter
              animate={{ type: "timing", duration: Motion.slow }}
              color={Palette.accent}
              points={drawn.diff.slice(-1)}
              radius={4.5}
              shape="circle"
            />
          </>
        )}
      </CartesianChart>
    </View>
  );
}

/** Un color por formato. Nada simbólico: solo separar dos o tres porciones. */
const FORMAT_COLORS = ["#007A55", "#5EEAD4", "#FBBF24", "#A5B4FC"] as const;

/**
 * Con cuántos equipos se juega, en anillo.
 *
 * Es la pregunta que decide todo lo demás —una reta de tres no se reparte ni se
 * gana igual que un duelo— y en el historial estaba enterrada. En el hueco va
 * el formato de siempre, que es la respuesta corta.
 */
export function FormatDonut({ formats }: { formats: FormatCount[] }) {
  if (formats.length === 0) return null;

  const total = formats.reduce((sum, format) => sum + format.count, 0);
  const favourite = formats.reduce((best, format) =>
    format.count > best.count ? format : best
  );

  const data = formats.map((format, index) => ({
    label: `${format.teams} equipos`,
    value: format.count,
    color: FORMAT_COLORS[index % FORMAT_COLORS.length],
  }));

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.four,
      }}
    >
      <View style={{ width: DIAL, height: DIAL }}>
        <PolarChart
          colorKey="color"
          data={data}
          labelKey="label"
          valueKey="value"
        >
          <Pie.Chart innerRadius="64%">
            {() => (
              <Pie.Slice animate={{ type: "timing", duration: Motion.slow }} />
            )}
          </Pie.Chart>
        </PolarChart>

        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            inset: 0,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text variant="statSmall">{favourite.teams}</Text>
          <Text tone="faint" variant="eyebrow">
            equipos
          </Text>
        </View>
      </View>

      <View style={{ flex: 1, gap: Spacing.two }}>
        {data.map((slice, index) => (
          <View
            key={slice.label}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: Spacing.two,
            }}
          >
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: slice.color,
              }}
            />
            <Text style={{ flex: 1 }} tone="muted" variant="caption">
              {slice.label}
            </Text>
            <Text variant="caption">
              {Math.round((formats[index].count / total) * 100)}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/**
 * Quién sale más convocado, en barras.
 *
 * No es un ranking de calidad: es cuántas veces entró en un reparto. Sirve para
 * la pregunta incómoda de toda reta —"¿por qué a mí nunca me toca?"— y la
 * contesta con el número, que es la única forma de zanjarla.
 */
export function CallupBars({
  players,
  roster,
}: {
  players: PlayerCount[];
  roster: Player[] | null;
}) {
  if (players.length === 0) {
    return (
      <Text tone="faint" variant="caption">
        Todavía no hay repartos guardados.
      </Text>
    );
  }

  const peak = Math.max(...players.map((player) => player.count));

  return (
    <View style={{ gap: Spacing.two }}>
      {players.map((entry) => (
        <View
          key={entry.playerId}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: Spacing.two,
          }}
        >
          <Face
            player={roster?.find((item) => item.id === entry.playerId) ?? null}
          />

          <Text numberOfLines={1} style={{ width: 78 }} variant="caption">
            {entry.name}
          </Text>

          <View
            style={{
              flex: 1,
              height: 18,
              borderRadius: Radius.sm,
              borderCurve: "continuous",
              backgroundColor: Palette.surfaceSunken,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                width: `${(entry.count / peak) * 100}%`,
                height: 18,
                borderRadius: Radius.sm,
                backgroundColor: Palette.accent,
              }}
            />
          </View>

          <Text style={{ width: 22, textAlign: "right" }} variant="caption">
            {entry.count}
          </Text>
        </View>
      ))}
    </View>
  );
}

/**
 * Las parejas que más caen juntas.
 *
 * Dos caras y una cifra: el reparto equilibra por overall, no por afinidad, así
 * que si dos coinciden ocho veces de diez no es amistad, es que el algoritmo
 * los trata como intercambiables. Verlo es lo que permite discutirlo.
 */
export function PairList({
  pairs,
  roster,
}: {
  pairs: PairStat[];
  roster: Player[] | null;
}) {
  if (pairs.length === 0) {
    return (
      <Text tone="faint" variant="caption">
        Nadie ha coincidido en el mismo equipo más de una vez.
      </Text>
    );
  }

  return (
    <View style={{ gap: Spacing.two }}>
      {pairs.map((pair) => {
        const [oneId, otherId] = pair.key.split("-").map(Number);

        return (
          <View
            key={pair.key}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: Spacing.three,
              paddingVertical: Spacing.two,
              borderBottomWidth: 1,
              borderBottomColor: Palette.hairline,
            }}
          >
            <View style={{ flexDirection: "row" }}>
              <Face
                player={roster?.find((item) => item.id === oneId) ?? null}
              />
              {/* Superpuestas: son una pareja, no dos filas. */}
              <View style={{ marginLeft: -10 }}>
                <Face
                  player={roster?.find((item) => item.id === otherId) ?? null}
                />
              </View>
            </View>

            <Text numberOfLines={1} style={{ flex: 1 }} variant="caption">
              {pair.a} · {pair.b}
            </Text>

            <Text tone="accent" variant="statSmall">
              {pair.count}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

/** Retrato pequeño, con hueco gris cuando el jugador ya no está en la plantilla. */
function Face({ player }: { player: Player | null }) {
  if (player === null) {
    return (
      <View
        style={{
          width: 26,
          height: 26,
          borderRadius: 13,
          backgroundColor: Palette.surfaceSunken,
          borderWidth: 1,
          borderColor: Palette.line,
        }}
      />
    );
  }

  return <PlayerAvatar player={player} size={26} />;
}
