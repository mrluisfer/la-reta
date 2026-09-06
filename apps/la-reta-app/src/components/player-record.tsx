import { View } from "react-native";

import { Icon, type IconName } from "@/components/ui/icon";
import { Surface } from "@/components/ui/surface";
import { Text } from "@/components/ui/text";
import { Palette, Radius, Spacing } from "@/constants/theme";
import type { PlayerRecord, PlayerTally, Result } from "@/lib/players";

/** Cuántos resultados caben en la tira de forma sin apretarse. */
const FORM_LENGTH = 5;

const RESULT_LETTER: Record<Result, string> = {
  win: "G",
  draw: "E",
  loss: "P",
};

const RESULT_COLOR: Record<Result, string> = {
  win: Palette.accent,
  draw: Palette.inkFaint,
  loss: Palette.danger,
};

const RESULT_NAME: Record<Result, string> = {
  win: "Ganó",
  draw: "Empató",
  loss: "Perdió",
};

/**
 * Todo lo que el acta sabe del jugador, en una sola tarjeta de tres pisos.
 *
 * Estaban antes los tres números de ataque —goles, asistencias y su suma— y no
 * mucho más, que es media ficha: un jugador de la reta se define tanto por lo
 * que mete como por si su equipo gana cuando él está. Los tres pisos van de lo
 * suyo a lo del equipo: lo que aporta, cómo le fue, y cómo le está yendo
 * últimamente.
 *
 * Se apila en una sola superficie en vez de tres tarjetas sueltas porque es una
 * sola idea leída con más o menos detalle; tres tarjetas obligarían a decidir
 * cuál mirar antes.
 */
export function PerformanceCard({
  tally,
  record,
}: {
  tally: PlayerTally;
  record: PlayerRecord;
}) {
  const balance = record.scored - record.conceded;

  return (
    <Surface padded={false}>
      <View style={{ flexDirection: "row", paddingVertical: Spacing.three }}>
        <Tally icon="ball" label="Goles" value={tally.goals} />
        <Divider />
        <Tally icon="arrow" label="Asistencias" value={tally.assists} />
        <Divider />
        <Tally
          icon="trophy"
          label="G + A"
          value={tally.goals + tally.assists}
        />
      </View>

      <Hairline />

      <View style={{ flexDirection: "row", paddingVertical: Spacing.three }}>
        <Count label="Jugados" value={record.played} />
        <Count color={Palette.accent} label="Ganados" value={record.won} />
        <Count label="Empatados" value={record.drawn} />
        <Count color={Palette.danger} label="Perdidos" value={record.lost} />
      </View>

      {record.form.length === 0 ? null : (
        <>
          <Hairline />
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: Spacing.three,
              padding: Spacing.three,
            }}
          >
            <FormGuide form={record.form} />

            <View style={{ alignItems: "flex-end", gap: Spacing.half }}>
              <Text variant="bodyStrong">
                {record.scored}–{record.conceded}
              </Text>
              <Text tone="faint" variant="eyebrow">
                {balance === 0
                  ? "Equilibrio"
                  : `${balance > 0 ? "+" : ""}${balance} de saldo`}
              </Text>
            </View>
          </View>
        </>
      )}
    </Surface>
  );
}

/**
 * Los últimos resultados, del más viejo al más nuevo.
 *
 * El orden importa y es el contrario al de la lista de partidos: una tira de
 * forma se lee de izquierda a derecha como una línea de tiempo, y ponerla al
 * revés haría que una racha ascendente pareciera un desplome.
 */
function FormGuide({ form }: { form: Result[] }) {
  const recent = form.slice(0, FORM_LENGTH).reverse();

  return (
    <View style={{ gap: Spacing.two }}>
      <Text tone="faint" variant="eyebrow">
        Últimos
      </Text>
      <View style={{ flexDirection: "row", gap: Spacing.one }}>
        {recent.map((result, index) => (
          <View
            accessibilityLabel={RESULT_NAME[result]}
            // Los resultados se repiten, así que la identidad es la posición.
            key={`${result}-${index}`}
            style={{
              width: 26,
              height: 26,
              borderRadius: Radius.sm,
              borderCurve: "continuous",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: RESULT_COLOR[result],
            }}
          >
            <Text style={{ color: Palette.surface }} variant="caption">
              {RESULT_LETTER[result]}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function Tally({
  icon,
  label,
  value,
}: {
  icon: IconName;
  label: string;
  value: number;
}) {
  return (
    <View style={{ flex: 1, alignItems: "center", gap: Spacing.one }}>
      <Icon color={Palette.accent} name={icon} size={18} />
      <Text variant="stat">{value}</Text>
      <Text tone="faint" variant="eyebrow">
        {label}
      </Text>
    </View>
  );
}

/**
 * Una cifra del balance. Sin icono a propósito: cuatro dibujos en fila
 * competirían con los tres de arriba y la tarjeta se convertiría en un tablero
 * de símbolos. El color hace el trabajo de distinguirlas.
 */
function Count({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <View style={{ flex: 1, alignItems: "center", gap: Spacing.half }}>
      <Text style={color ? { color } : undefined} variant="statSmall">
        {value}
      </Text>
      <Text numberOfLines={1} tone="faint" variant="eyebrow">
        {label}
      </Text>
    </View>
  );
}

function Divider() {
  return <View style={{ width: 1, backgroundColor: Palette.hairline }} />;
}

function Hairline() {
  return <View style={{ height: 1, backgroundColor: Palette.hairline }} />;
}
