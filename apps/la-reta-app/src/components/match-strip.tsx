import { View } from "react-native";

import type { ColorIconName } from "@/components/ui/color-icon";
import { Figure } from "@/components/ui/figure";
import { Palette, Spacing } from "@/constants/theme";
import { matchAssists, matchGoals, matchParticipants } from "@/lib/teams";
import type { Match } from "@/lib/types";

/**
 * Las cifras del partido, en la misma tira que usa la portada.
 *
 * Es el mismo objeto —filetes arriba y abajo, columnas centradas, iconos a
 * color— y eso es lo que se busca: quien ya leyó la tira de Inicio no tiene que
 * aprender nada aquí. Antes esto era una línea de texto al pie ("15 goles · 3
 * equipos · balance 90/100") que se leía como un pie de foto y no como datos.
 *
 * Las asistencias solo salen si alguien las apuntó. En las actas viejas son
 * todas cero, y una columna de ceros no informa de que no hubo asistencias:
 * informa de que nadie las registró, que es otra cosa y no cabe en una cifra.
 */
export function MatchStrip({ match }: { match: Match }) {
  const assists = matchAssists(match);

  const cells: { label: string; value: number; icon: ColorIconName }[] = [
    { label: "Goles", value: matchGoals(match), icon: "goal" },
    { label: "Jugaron", value: matchParticipants(match), icon: "people" },
    ...(assists > 0
      ? [{ label: "Asistencias", value: assists, icon: "star" as const }]
      : [{ label: "Equipos", value: match.teams?.length ?? 2, icon: "jersey" as const }]),
  ];

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
            value={cell.value}
          />
        </View>
      ))}
    </View>
  );
}
