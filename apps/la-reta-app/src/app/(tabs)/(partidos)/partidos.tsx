import { useRouter } from "expo-router";
import { FlatList, RefreshControl, View } from "react-native";

import { MatchCard, MatchCardSkeleton } from "@/components/match-card";
import { Notice } from "@/components/notice";
import { Text } from "@/components/ui/text";
import {
  BottomTabInset,
  MaxContentWidth,
  Palette,
  Spacing,
} from "@/constants/theme";
import { useReta } from "@/hooks/use-reta";

/** Cuántas tarjetas en hueco caben en una pantalla antes de hacer scroll. */
const SKELETON_CARDS = Array.from({ length: 3 }, (_, i) => `hueco-${i}`);

/**
 * Historial de partidos, del más reciente al más viejo — el orden en que ya
 * llegan de la API.
 *
 * El primero va destacado en verde: es el que la gente abre la app para ver, y
 * entre cinco tarjetas blancas iguales no se distinguía del de hace meses.
 */
export default function PartidosScreen() {
  const router = useRouter();
  const { matches, players, loading, pending, error, refetch } = useReta();

  return (
    <FlatList
      contentContainerStyle={{
        alignSelf: "center",
        width: "100%",
        maxWidth: MaxContentWidth,
        gap: Spacing.three,
        paddingHorizontal: Spacing.four,
        paddingTop: Spacing.three,
        paddingBottom: BottomTabInset + Spacing.five,
      }}
      aria-busy={pending}
      contentInsetAdjustmentBehavior="automatic"
      data={matches ?? []}
      keyExtractor={(match) => String(match.id)}
      ListEmptyComponent={
        // Tres estados distintos y ninguno se puede confundir con otro: en la
        // primera carga van las tarjetas en hueco, mientras se refresca no se
        // dice nada (lo de antes sigue en pantalla) y solo con la respuesta en
        // la mano se afirma que no hay partidos.
        pending ? (
          <View style={{ gap: Spacing.three }}>
            {SKELETON_CARDS.map((key) => (
              <MatchCardSkeleton key={key} showDate />
            ))}
          </View>
        ) : loading ? null : (
          <View style={{ paddingVertical: Spacing.six, alignItems: "center" }}>
            <Text tone="faint" variant="caption">
              Todavía no hay partidos registrados.
            </Text>
          </View>
        )
      }
      ListHeaderComponent={
        error === null ? null : (
          <Notice
            actionLabel="Reintentar"
            detail={error}
            onAction={refetch}
            title="No pudimos leer los partidos"
          />
        )
      }
      refreshControl={
        <RefreshControl
          onRefresh={refetch}
          // La primera carga la cuentan las tarjetas en hueco; el indicador de
          // arriba queda para el refresco a mano.
          refreshing={loading && !pending}
          tintColor={Palette.accent}
        />
      }
      renderItem={({ item, index }) => (
        <MatchCard
          // La API ordena del más reciente al más viejo, así que el primero es
          // el último jugado.
          featured={index === 0}
          match={item}
          onPress={() =>
            router.push({
              pathname: "/partido/[id]",
              params: { id: String(item.id) },
            })
          }
          players={players}
          showDate
        />
      )}
    />
  );
}
