"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatShortDate } from "@/lib/dates";
import type { MatchWithScorers } from "@/lib/queries";
import { matchTeams } from "@/lib/teams";
import { cn } from "@/lib/utils";
import { Bar, BarChart, CartesianGrid, ReferenceLine, XAxis } from "recharts";

const chartConfig = {
  total: { label: "Goles", color: "var(--chart-1)" },
} satisfies ChartConfig;

/**
 * Total goals per match with the average as a reference line — a compact way to
 * compare matches at a glance. Reused on the dashboard and the matches page.
 * `matches` comes newest-first; we plot the last `limit` chronologically.
 */
export const MatchesChart = ({
  matches,
  limit = 8,
  className,
}: {
  readonly matches: MatchWithScorers[];
  readonly limit?: number;
  readonly className?: string;
}) => {
  const data = matches
    .slice(0, limit)
    .reverse()
    .map((m) => ({
      label: formatShortDate(m.playedAt),
      // Suma de todos los equipos: con 3+ el par A/B no es el total.
      total: matchTeams(m).reduce((n, t) => n + t.score, 0),
    }));

  const avg = data.length
    ? Math.round((data.reduce((a, d) => a + d.total, 0) / data.length) * 10) /
      10
    : 0;

  return (
    // `reveal-on-scroll` (scroll-driven CSS, `animation-timeline: view()`) en
    // vez de un `whileInView` de Motion: la gráfica suele quedar bajo el
    // pliegue y esto la deja entrar al llegar a ella sin coste de JS ni de
    // hilo principal. Es además lo que ya usa el historial de esta misma
    // página, así que ambos entran igual. Recharts anima sus barras aparte.
    <Card className={cn("reveal-on-scroll h-fit", className)} size="sm">
      <CardHeader className="border-b">
        <CardTitle className="text-base">Goles por partido</CardTitle>
        <CardDescription>
          Comparativa de los últimos {data.length} · media {avg}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        {data.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-sm">
            Aún no hay partidos para graficar.
          </p>
        ) : (
          <ChartContainer config={chartConfig} className="h-[170px] w-full">
            <BarChart
              accessibilityLayer
              data={data}
              margin={{ top: 4, right: 4, left: 4, bottom: 0 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={6}
                fontSize={10}
                interval="preserveStartEnd"
              />
              <ChartTooltip
                content={<ChartTooltipContent indicator="line" />}
              />
              <ReferenceLine
                y={avg}
                stroke="var(--foreground)"
                strokeOpacity={0.4}
                strokeDasharray="4 4"
              />
              <Bar dataKey="total" fill="var(--color-total)" radius={4} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
};
