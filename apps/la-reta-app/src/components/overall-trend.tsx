import { View } from "react-native";
import { Area, CartesianChart, Line, Scatter } from "victory-native";

import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { Motion, Palette, Radius, Spacing } from "@/constants/theme";
import { useChartFont } from "@/hooks/use-chart-font";
import { formatShortDate } from "@/lib/dates";
import { statChangeLog, type HistoryEvent } from "@/lib/players";
import { overallSeries } from "@/lib/series";
import { STAT_ABBR, type StatSnapshot } from "@/lib/types";

/** Skia parsea color CSS pero no la palabra `transparent`. */
const TRANSPARENT = "rgba(0, 0, 0, 0)";
/** Rojo apagado de las pastillas que bajan. */
const DANGER_TINT = "rgba(231, 0, 11, 0.08)";

const CHART_HEIGHT = 150;
/** Con un solo ajuste no hay recorrido: eso es el overall de hoy, no una curva. */
const MIN_POINTS = 2;
/** Aire arriba y abajo del recorrido, en puntos de overall. */
const PADDING = 4;

/**
 * Cómo ha ido cambiando el overall del jugador.
 *
 * Es el dato que la base guardaba desde el principio —`player_stat_history`
 * apunta una instantánea cada vez que alguien le toca los atributos— y que la
 * app nunca enseñó. La carta dice cuánto vale hoy; esto dice si viene subiendo
 * o si aquel 60 del alta era optimismo del que lo dio de alta.
 *
 * Línea con relleno y no barras, al revés que los goles por jornada: aquí sí
 * hay continuidad —entre dos ajustes el jugador sigue valiendo lo mismo— y lo
 * que se lee es la pendiente. **Un punto por revisión**, porque cada uno es una
 * decisión que alguien tomó un día concreto, y sin ellos la curva parecía la
 * medición continua de algo que no se mide solo.
 *
 * El eje Y se ciñe al recorrido en vez de arrancar en cero: entre 39 y 42 hay
 * una historia, y sobre una escala de 0 a 99 esa historia es una raya plana.
 */
export function OverallTrend({
  history,
  pending = false,
}: {
  history: StatSnapshot[] | null;
  /** Primera carga: sin esto se anunciaría que no hay historial. */
  pending?: boolean;
}) {
  const data = overallSeries(history);
  const font = useChartFont(11);

  if (pending) {
    return <Skeleton height={CHART_HEIGHT} />;
  }

  if (data.length < MIN_POINTS) {
    return (
      <Text tone="faint" variant="caption">
        Todavía no le han retocado los atributos: su carta es la del alta.
      </Text>
    );
  }

  const values = data.map((point) => point.overall);
  const floor = Math.max(0, Math.min(...values) - PADDING);
  const ceiling = Math.max(...values) + PADDING;

  return (
    <View style={{ height: CHART_HEIGHT }}>
      <CartesianChart
        data={data}
        // Ceñir la escala al recorrido es lo que hace legible un cambio de tres
        // puntos; ver la nota de arriba.
        domain={{ y: [floor, ceiling] }}
        // Sin hueco lateral el primer y el último punto se pintan medio fuera
        // del lienzo, y con ellos su etiqueta de fecha.
        domainPadding={{ left: 22, right: 22, top: 12, bottom: 12 }}
        xAxis={{
          font,
          labelColor: Palette.inkFaint,
          lineColor: TRANSPARENT,
          // Solo los extremos: con siete ajustes, siete fechas se pisan unas a
          // otras y el eje pasa de situar a estorbar.
          tickValues: [0, data.length - 1],
          formatXLabel: (value) => data[Number(value)]?.label ?? "",
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
        yKeys={["overall"]}
      >
        {({ points, chartBounds }) => (
          <>
            <Area
              animate={{ type: "timing", duration: Motion.slow }}
              color={Palette.accentSoft}
              curveType="monotoneX"
              points={points.overall}
              // `y0` va en coordenadas del lienzo, no en las del dato: con un
              // 0 el relleno arrancaba en el borde de arriba y sombreaba el
              // hueco *sobre* la línea, justo al revés de lo que parecía.
              y0={chartBounds.bottom}
            />
            <Line
              animate={{ type: "timing", duration: Motion.slow }}
              color={Palette.accent}
              curveType="monotoneX"
              points={points.overall}
              strokeWidth={2.5}
            />
            {/* Cada revisión, un punto hueco: relleno del color del papel y
                aro verde encima, para que la línea no se le vea por dentro. */}
            <Scatter
              animate={{ type: "timing", duration: Motion.slow }}
              color={Palette.surface}
              points={points.overall}
              radius={3.6}
              shape="circle"
            />
            <Scatter
              animate={{ type: "timing", duration: Motion.slow }}
              color={Palette.accent}
              points={points.overall}
              radius={3.6}
              shape="circle"
              strokeWidth={2}
              style="stroke"
            />
            {/* El último, macizo: es donde está hoy. */}
            <Scatter
              animate={{ type: "timing", duration: Motion.slow }}
              color={Palette.accent}
              points={points.overall.slice(-1)}
              radius={4.5}
              shape="circle"
            />
          </>
        )}
      </CartesianChart>
    </View>
  );
}

/**
 * El titular de la gráfica: cuántas revisiones lleva y de dónde a dónde va.
 *
 * Sin signo ni color. La diferencia contra la primera instantánea no es una
 * nota —esa primera la escribe quien da de alta al jugador con lo que le
 * parece—, así que pintarla en rojo convertía una estimación corregida en un
 * bajón. En el diario de abajo sí hay signos, porque ahí cada cambio es una
 * decisión sobre alguien a quien ya se había visto jugar.
 */
export function TrendHeadline({ history }: { history: StatSnapshot[] | null }) {
  if (!history || history.length < MIN_POINTS) return null;

  const first = history[0].overall;
  const last = history.at(-1)?.overall ?? first;

  return (
    <Text tone="muted" variant="caption">
      {`${history.length} revisiones · de ${first} a ${last} OVR`}
    </Text>
  );
}

/**
 * El diario de ajustes: qué se le tocó y cuándo, del más reciente al más viejo.
 *
 * La curva dice la forma; esto dice el porqué de cada escalón. Cada revisión
 * lleva su fila con un filete a la izquierda —el mismo patrón de línea de
 * tiempo que ya usa la ficha de la web— y una pastilla por atributo movido,
 * verde si subió y roja si bajó.
 */
export function StatChangeLog({ history }: { history: StatSnapshot[] | null }) {
  const events = statChangeLog(history);
  if (events.length === 0) return null;

  return (
    <View style={{ gap: Spacing.three }}>
      <Text tone="faint" variant="eyebrow">
        Cada ajuste
      </Text>
      {events.map((event) => (
        <EventRow event={event} key={event.recordedAt} />
      ))}
    </View>
  );
}

function EventRow({ event }: { event: HistoryEvent }) {
  const delta = event.overallTo - event.overallFrom;

  return (
    <View
      style={{
        gap: Spacing.two,
        paddingLeft: Spacing.three,
        borderLeftWidth: 2,
        borderLeftColor: Palette.line,
      }}
    >
      <View
        style={{ flexDirection: "row", alignItems: "center", gap: Spacing.two }}
      >
        <Text variant="caption">{formatShortDate(event.recordedAt)}</Text>
        <Text style={{ flex: 1 }} tone="faint" variant="caption">
          {delta === 0
            ? "sin mover el OVR"
            : `OVR ${event.overallFrom} → ${event.overallTo}`}
        </Text>
        {delta === 0 ? null : (
          <Text
            style={{ color: delta > 0 ? Palette.accent : Palette.danger }}
            variant="caption"
          >
            {delta > 0 ? `+${delta}` : delta}
          </Text>
        )}
      </View>

      <View
        style={{ flexDirection: "row", flexWrap: "wrap", gap: Spacing.one }}
      >
        {event.changes.map((change) => (
          <View
            key={change.key}
            style={{
              paddingHorizontal: Spacing.two,
              paddingVertical: 3,
              borderRadius: Radius.sm,
              borderCurve: "continuous",
              backgroundColor:
                change.delta > 0 ? Palette.accentSoft : DANGER_TINT,
            }}
          >
            <Text
              style={{
                color: change.delta > 0 ? Palette.accent : Palette.danger,
              }}
              variant="caption"
            >
              {`${STAT_ABBR[change.key]} ${change.from}→${change.to}`}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
