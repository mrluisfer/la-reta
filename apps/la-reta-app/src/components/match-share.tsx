import { View } from "react-native";
import { Pie, PolarChart } from "victory-native";

import { Text } from "@/components/ui/text";
import { Motion, Palette, Spacing } from "@/constants/theme";
import { balanceLabel, teamColor, type RankedTeam } from "@/lib/teams";

/** Lado del lienzo de cada gráfica, en puntos. Los dos, para que casen. */
const DIAL = 132;
/** Tope de la escala de equilibrio, tal como lo guarda la columna. */
const BALANCE_MAX = 100;

/**
 * Dos esferas, lado a lado: cómo se repartieron los goles y cómo de parejo
 * estuvo.
 *
 * Van en fila y no apiladas porque en un móvil el alto es lo caro y el ancho
 * sobra: dos anillos de 132 pt caben de sobra en una fila y ocupan lo que
 * ocupaba una sola barra con su etiqueta. Y porque son la misma clase de dato
 * —dos proporciones— y puestas juntas se comparan de una mirada.
 */
export function MatchDials({
  teams,
  balance,
}: {
  teams: RankedTeam[];
  balance: number;
}) {
  return (
    <View style={{ flexDirection: "row", gap: Spacing.three }}>
      <View style={{ flex: 1, alignItems: "center", gap: Spacing.two }}>
        <GoalDonut teams={teams} />
        <Text tone="faint" variant="eyebrow">
          Reparto
        </Text>
      </View>

      <View style={{ flex: 1, alignItems: "center", gap: Spacing.two }}>
        <BalanceArc balance={balance} />
        <Text tone="faint" variant="eyebrow">
          Equilibrio
        </Text>
      </View>
    </View>
  );
}

/**
 * El reparto de goles, en anillo.
 *
 * La tabla de arriba dice el marcador; esto dice la **proporción**, que es otra
 * pregunta. Un 8–6–1 y un 8–1–6 se leen igual en columna y cuentan retas muy
 * distintas: en el anillo se ve de un vistazo que uno de los tres se quedó sin
 * jugar el partido.
 *
 * Anillo y no tarta: el hueco del centro no es adorno, es donde va el total, y
 * así la pieza responde las dos preguntas —cuántos goles cayeron y cómo se
 * repartieron— sin una etiqueta más.
 *
 * Los colores son los mismos filetes de la tabla y de los bloques de
 * goleadores, así que no hace falta leyenda: el tramo azul es la fila azul.
 */
function GoalDonut({ teams }: { teams: RankedTeam[] }) {
  const scoring = teams.filter((team) => team.score > 0);
  const total = scoring.reduce((sum, team) => sum + team.score, 0);

  if (total === 0) {
    return (
      <View style={{ height: DIAL, justifyContent: "center" }}>
        <Text tone="faint" variant="caption">
          Sin goles
        </Text>
      </View>
    );
  }

  const data = scoring.map((team) => ({
    label: team.name,
    value: team.score,
    color: teamColor(team.key),
  }));

  return (
    <View style={{ width: DIAL, height: DIAL }}>
      <PolarChart
        colorKey="color"
        data={data}
        labelKey="label"
        valueKey="value"
      >
        <Pie.Chart innerRadius="66%">
          {() => (
            <Pie.Slice
              animate={{ type: "timing", duration: Motion.slow }}
            />
          )}
        </Pie.Chart>
      </PolarChart>

      <Center label={total === 1 ? "gol" : "goles"} value={String(total)} />
    </View>
  );
}

/**
 * Cómo de parejo estuvo, en un arco.
 *
 * Antes esto era "balance 90/100" en letra pequeña al pie. El número está bien
 * para quien lo busca, pero nadie sabe de memoria si 90 es mucho: el arco lo
 * responde sin leer, y la palabra —"Parejísima"— lo dice en el idioma en que se
 * comenta el partido.
 *
 * Medio anillo y no entero: un marcador que no puede pasar de 100 se lee mejor
 * como aguja de cuadro de mandos que como tarta, y además distingue esta esfera
 * de la de al lado, que sí es un reparto.
 */
function BalanceArc({ balance }: { balance: number }) {
  const value = Math.min(Math.max(balance, 0), BALANCE_MAX);

  const data = [
    { label: "Equilibrio", value, color: Palette.accent },
    {
      label: "Resto",
      value: BALANCE_MAX - value,
      color: Palette.surfaceSunken,
    },
  ];

  return (
    <View style={{ width: DIAL, height: DIAL }}>
      <PolarChart
        colorKey="color"
        data={data}
        labelKey="label"
        valueKey="value"
      >
        {/* Media vuelta arrancando a las nueve: el arco sube de izquierda a
            derecha, como se lee. */}
        <Pie.Chart circleSweepDegrees={180} innerRadius="66%" startAngle={180}>
          {() => (
            <Pie.Slice
              animate={{ type: "timing", duration: Motion.slow }}
            />
          )}
        </Pie.Chart>
      </PolarChart>

      <Center label={balanceLabel(balance)} value={String(value)} />
    </View>
  );
}

/**
 * El hueco del anillo.
 *
 * Va en texto de React Native y no dibujado en el lienzo: Skia pinta su propio
 * texto con una fuente cargada aparte, y el número del centro tiene que ser
 * exactamente la misma cifra en Oswald que el resto de la app.
 */
function Center({ value, label }: { value: string; label: string }) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        inset: 0,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text variant="statSmall">{value}</Text>
      <Text numberOfLines={1} tone="faint" variant="eyebrow">
        {label}
      </Text>
    </View>
  );
}
