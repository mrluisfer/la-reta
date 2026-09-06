import { View } from "react-native";
import { CartesianChart, HorizontalBar } from "victory-native";

import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { Motion, Palette } from "@/constants/theme";
import { useChartFont } from "@/hooks/use-chart-font";
import { topScorers } from "@/lib/series";
import type { Match } from "@/lib/types";

/** Skia parsea color CSS pero no la palabra `transparent`. */
const TRANSPARENT = "rgba(0, 0, 0, 0)";

export const SCORER_RACE_SIZE = 5;

/** Alto por barra, más el sitio del eje de goles. */
const ROW_HEIGHT = 30;
const AXIS_HEIGHT = 26;

/**
 * La tabla de goleadores de la temporada.
 *
 * Es la estadística que la reta discute sola, y hasta ahora la portada solo
 * enseñaba al mejor por overall —que es otra cosa: el ranking dice quién juega
 * mejor, esto dice quién la mete—.
 *
 * En barras y no en lista numerada porque aquí la pregunta no es el orden sino
 * la distancia: una lista "8, 7, 6" y otra "8, 3, 1" se leen igual en texto y
 * cuentan campeonatos muy distintos.
 */
export function ScorerRace({
  matches,
  pending = false,
}: {
  matches: Match[] | null;
  /** Primera carga: sin esto la gráfica vacía diría que no hay goles. */
  pending?: boolean;
}) {
  const data = topScorers(matches, SCORER_RACE_SIZE);
  const font = useChartFont(11);

  if (pending) {
    return <ScorerRaceSkeleton />;
  }

  if (data.length === 0) {
    return (
      <Text tone="faint" variant="caption">
        Todavía no hay goles registrados.
      </Text>
    );
  }

  return (
    <View style={{ height: data.length * ROW_HEIGHT + AXIS_HEIGHT }}>
      <CartesianChart
        data={data}
        // Desde cero, por lo mismo que la gráfica de jornadas: una barra vale
        // lo que mide, y con el suelo pegado al mínimo el último de la tabla se
        // queda sin barra.
        domain={{ y: [0, Math.max(...data.map((row) => row.goals))] }}
        domainPadding={{ top: 12, bottom: 12, right: 16 }}
        orientation="horizontal"
        // En horizontal los papeles se cambian: el eje X lleva los goles y el
        // Y los nombres.
        xAxis={{
          font,
          labelColor: Palette.inkFaint,
          lineColor: Palette.line,
          tickCount: 4,
          formatXLabel: (value) => String(Math.round(Number(value))),
        }}
        xKey="name"
        yAxis={[
          {
            font,
            labelColor: Palette.inkMuted,
            lineColor: TRANSPARENT,
          },
        ]}
        yKeys={["goals"]}
      >
        {({ points, chartBounds }) => (
          <HorizontalBar
            animate={{ type: "timing", duration: Motion.slow }}
            chartBounds={chartBounds}
            color={Palette.accent}
            points={points.goals}
            roundedCorners={{ topRight: 6, bottomRight: 6 }}
          />
        )}
      </CartesianChart>
    </View>
  );
}

/** Las barras que van a salir, en el mismo alto y con la caída de una tabla real. */
const SKELETON_WIDTHS = ["86%", "68%", "54%", "42%", "30%"] as const;

function ScorerRaceSkeleton() {
  return (
    <View style={{ height: SCORER_RACE_SIZE * ROW_HEIGHT + AXIS_HEIGHT }}>
      {SKELETON_WIDTHS.map((width) => (
        <View
          key={width}
          style={{
            height: ROW_HEIGHT,
            justifyContent: "center",
          }}
        >
          <Skeleton height={18} width={width} />
        </View>
      ))}
    </View>
  );
}
