import { View } from "react-native";

import { Icon, type IconName } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { Palette, Radius, Spacing } from "@/constants/theme";
import type { PlayerAwards } from "@/lib/types";

type Honour = {
  key: string;
  icon: IconName;
  color: string;
  tint: string;
  count: number;
  label: string;
};

/** Rojo apagado para la chapa del blooper. */
const DANGER_TINT = "rgba(231, 0, 11, 0.10)";
/** Gris del recado: lavar las casacas no es un premio. */
const CHORE_TINT = "rgba(9, 9, 11, 0.06)";

/**
 * ¿Hay algo que enseñar? La ficha decide con esto si monta la sección.
 *
 * La respuesta vive aquí y no en la pantalla porque depende de qué chapas
 * existen, que es cosa de este archivo: añadir una mañana no debería obligar a
 * tocar la condición de la ficha.
 */
export function hasHonours(
  awards: PlayerAwards | null,
  casacas: number
): boolean {
  if (awards === null) return casacas > 0;
  return awards.figura + awards.gol + awards.error + casacas > 0;
}

/**
 * El palmarés: lo que la reta le ha votado y lo que le ha tocado.
 *
 * Son datos que llevaban meses en la base sin que nadie los viera desde la
 * ficha —los premios se votan al acabar cada partido y la ruleta de casacas
 * lleva su propia cuenta—, y son justo los que se cuentan en el grupo. Un
 * "figura ×3" dice más de alguien en la reta que su overall.
 *
 * **Pastillas y no tarjetas.** Cada chapa es un icono y un número; metida en
 * una tarjeta con su sombra, el marco pesaba más que el dato y tres premios se
 * comían el alto de un bloque entero. En fila y a su ancho, el palmarés cabe en
 * un renglón y se lee de corrido.
 *
 * Solo salen las chapas con cuenta, y si no hay ninguna no se dibuja nada: la
 * sección entera se queda fuera, porque anunciar "todavía nada" en lo más alto
 * de la ficha es dedicarle el mejor sitio a una ausencia.
 */
export function HonoursStrip({
  awards,
  casacas,
  pending = false,
}: {
  awards: PlayerAwards | null;
  casacas: number;
  pending?: boolean;
}) {
  if (pending) {
    return <Skeleton height={34} />;
  }

  const honours = (
    [
      {
        key: "figura",
        icon: "star-fill",
        color: Palette.amber,
        tint: Palette.amberSoft,
        count: awards?.figura ?? 0,
        label: "Figura",
      },
      {
        key: "gol",
        icon: "ball",
        color: Palette.accent,
        tint: Palette.accentSoft,
        count: awards?.gol ?? 0,
        label: "Golazo",
      },
      {
        key: "error",
        icon: "flame",
        color: Palette.danger,
        tint: DANGER_TINT,
        count: awards?.error ?? 0,
        label: "Blooper",
      },
      {
        key: "casaca",
        icon: "jersey",
        color: Palette.inkMuted,
        tint: CHORE_TINT,
        count: casacas,
        label: "Casacas",
      },
    ] satisfies Honour[]
  ).filter((honour) => honour.count > 0);

  if (honours.length === 0) return null;

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: Spacing.two }}>
      {honours.map((honour) => (
        <Chip honour={honour} key={honour.key} />
      ))}
    </View>
  );
}

function Chip({ honour }: { honour: Honour }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.two,
        paddingLeft: Spacing.two,
        paddingRight: Spacing.three,
        paddingVertical: Spacing.two,
        borderRadius: Radius.pill,
        borderCurve: "continuous",
        backgroundColor: honour.tint,
      }}
    >
      <Icon color={honour.color} name={honour.icon} size={15} />
      <Text style={{ color: honour.color }} variant="caption">
        {honour.count} · {honour.label}
      </Text>
    </View>
  );
}
