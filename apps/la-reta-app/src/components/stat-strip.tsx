import { View } from "react-native";

import { Figure } from "@/components/ui/figure";
import type { ColorIconName } from "@/components/ui/color-icon";
import { Palette, Spacing } from "@/constants/theme";
import type { RetaSummary } from "@/lib/summary";

export type StatField = "squad" | "level" | "matches" | "goals";

const ALL_FIELDS: StatField[] = ["squad", "level", "matches", "goals"];

/**
 * La cabecera de cifras.
 *
 * Va sobre el papel con dos filetes horizontales y separadores verticales,
 * como el sumario de una portada. Sin tarjeta a propósito: son datos de
 * contexto, no un objeto que se pueda tocar.
 *
 * Cada columna va **centrada**. Alineadas a la izquierda, el icono (24 pt), la
 * cifra (30) y la etiqueta en versalitas (11) empezaban en el mismo borde pero
 * terminaban en tres sitios distintos, y al bajar la vista el bloque parecía
 * descolgarse hacia la derecha. Centradas comparten eje y se leen de una
 * pasada.
 *
 * Y sin relleno lateral: con cuatro columnas en un iPhone cada celda mide unos
 * 88 pt y "PLANTILLA" en versalitas espaciadas ocupa casi todos. Ocho puntos
 * de hueco bastaban para partirla en dos líneas.
 *
 * `fields` existe para que la portada sin sesión enseñe solo los agregados que
 * sirven de prueba —cuánta gente, cuántos partidos, cuántos goles— y no repita
 * el mismo cuadro de mando que ya hay dentro.
 */
export function StatStrip({
  summary,
  pending,
  fields = ALL_FIELDS,
}: {
  summary: RetaSummary;
  pending: boolean;
  fields?: StatField[];
}) {
  // Con cuatro columnas cada celda mide poco más de 70 pt y "Jugadores" parte
  // en dos líneas, lo que descuadra la altura de toda la tira.
  const tight = fields.length > 3;

  const byField: Record<
    StatField,
    { label: string; value: number; icon: ColorIconName }
  > = {
    squad: {
      label: tight ? "Plantilla" : "Jugadores",
      value: summary.squad,
      icon: "people",
    },
    level: { label: "Nivel", value: summary.avgOverall, icon: "star" },
    matches: {
      label: "Partidos",
      value: summary.matchesPlayed,
      icon: "trophy",
    },
    goals: { label: "Goles", value: summary.goals, icon: "goal" },
  };
  const cells = fields.map((field) => byField[field]);

  return (
    <View
      style={{
        flexDirection: "row",
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: Palette.hairline,
        paddingVertical: Spacing.three,
      }}
    >
      {cells.map((cell, index) => (
        <View
          key={cell.label}
          style={{
            flex: 1,
            borderLeftWidth: index === 0 ? 0 : 1,
            borderLeftColor: Palette.hairline,
          }}
        >
          <Figure
            align="center"
            icon={cell.icon}
            label={cell.label}
            value={pending ? null : cell.value}
          />
        </View>
      ))}
    </View>
  );
}
