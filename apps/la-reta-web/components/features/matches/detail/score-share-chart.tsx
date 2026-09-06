"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { TEAM_COLORS, type MatchTeamRow } from "@/lib/teams";
import { Cell, Label, Pie, PieChart } from "recharts";

/**
 * Total de goles, centrado en el hueco del dónut.
 *
 * Vive fuera del componente a propósito: definido dentro, React vería un tipo
 * nuevo en cada render y desmontaría el subárbol entero.
 */
const TotalLabel = ({
  total,
  viewBox,
}: {
  readonly total: number;
  readonly viewBox?: { cx?: number; cy?: number };
}) => {
  if (!viewBox?.cx) return null;
  const { cx, cy = 0 } = viewBox;
  return (
    <text dominantBaseline="middle" textAnchor="middle" x={cx} y={cy}>
      <tspan
        className="fill-foreground font-mono text-2xl font-black tabular-nums"
        x={cx}
        y={cy}
      >
        {total}
      </tspan>
      <tspan className="fill-muted-foreground text-xs" x={cx} y={cy + 18}>
        goles
      </tspan>
    </text>
  );
};

const tooltipRow = (value: unknown, name: unknown) => (
  <span className="flex w-full items-center justify-between gap-3">
    <span className="text-muted-foreground">{String(name)}</span>
    <span className="font-mono font-bold tabular-nums">{Number(value)}</span>
  </span>
);

/**
 * Reparto del marcador entre los equipos.
 *
 * Un dónut en vez de la barra segmentada que había antes: la barra obligaba a
 * comparar tramos de distinta posición sobre una línea, mientras que aquí cada
 * sector arranca del mismo centro y el total vive en el hueco. Además cada
 * sector responde al puntero con su propio tooltip, cosa que una barra pintada
 * a mano no da.
 */
export const ScoreShareChart = ({
  teams,
}: {
  readonly teams: MatchTeamRow[];
}) => {
  const total = teams.reduce((n, t) => n + t.score, 0);
  const data = teams.map((team) => ({
    key: team.key,
    name: team.name,
    // Sin goles el dónut se queda vacío: se reparte a partes iguales para que
    // siga leyéndose como "cero a cero" y no como un fallo de render.
    goals: total === 0 ? 1 : team.score,
  }));

  const config: ChartConfig = Object.fromEntries(
    teams.map((team) => [
      team.key,
      { label: team.name, color: TEAM_COLORS[team.key] },
    ])
  );

  return (
    <ChartContainer className="mx-auto aspect-square h-36" config={config}>
      <PieChart>
        <ChartTooltip
          content={<ChartTooltipContent formatter={tooltipRow} hideLabel />}
          cursor={false}
        />
        <Pie
          data={data}
          dataKey="goals"
          innerRadius={40}
          // Sin la animación de entrada de recharts: los sectores se dibujan
          // frame a frame, así que en una pestaña de fondo —donde el navegador
          // congela el frameloop— el dónut se queda vacío hasta volver a ella.
          // Pintado de una vez, siempre está.
          isAnimationActive={false}
          nameKey="name"
          outerRadius={62}
          paddingAngle={2}
          strokeWidth={2}
        >
          {data.map((entry) => (
            <Cell
              className="stroke-card focus:outline-none"
              fill={TEAM_COLORS[entry.key]}
              key={entry.key}
            />
          ))}
          {/* `Label` aquí es el de recharts, no un <label> de formulario:
              la regla de a11y lo confunde por el nombre. */}
          {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
          <Label content={<TotalLabel total={total} />} />
        </Pie>
      </PieChart>
    </ChartContainer>
  );
};
