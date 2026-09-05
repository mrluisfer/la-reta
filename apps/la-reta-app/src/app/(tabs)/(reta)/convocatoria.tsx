import { toNewReta, toRecentSplits } from "@repo/reta/api";
import {
  balanceTeamsVaried,
  canKeepGoal,
  type BalancedTeams,
} from "@repo/reta/balancer";
import { useMemo, useState } from "react";
import { ScrollView, Share, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CallupGrid } from "@/components/callup-grid";
import { GuestList } from "@/components/guest-list";
import { Notice } from "@/components/notice";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { RetaBoard, retaAsMessage } from "@/components/reta-board";
import { useTabAction, type TabAction } from "@/components/tab-action";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/ui/section";
import { Segmented } from "@/components/ui/segmented";
import { Surface } from "@/components/ui/surface";
import { Text } from "@/components/ui/text";
import { AccessoryInset, MaxContentWidth, Spacing } from "@/constants/theme";
import { useReta } from "@/hooks/use-reta";
import { useRetas } from "@/hooks/use-retas";
import { useTeamNames } from "@/hooks/use-team-names";
import { isGuest, makeGuest } from "@/lib/guests";
import type { Player } from "@/lib/types";

/** Cuánta gente hace falta por equipo para que repartir signifique algo. */
const MIN_PER_TEAM = 2;

const COUNT_OPTIONS = [
  { value: "2" as const, label: "2 equipos" },
  { value: "3" as const, label: "3 equipos" },
  { value: "4" as const, label: "4 equipos" },
];

/**
 * La convocatoria: quién juega hoy, quién se apunta de última hora y cómo
 * quedan los equipos.
 *
 * Tiene dos estados y solo enseña uno. Mientras se convoca, manda la rejilla;
 * en cuanto hay reparto, la rejilla desaparece y la pantalla es el resultado.
 * Es la diferencia entre una herramienta y un formulario: una vez repartido,
 * quién estaba marcado deja de ser la pregunta, y dejarlo en pantalla ponía
 * cien fichas entre el resultado y el pulgar de quien va a compartirlo.
 *
 * El repartidor es el mismo que corre la web (`@repo/reta/balancer`), así que
 * aquí no hay algoritmo: solo la información que le falta —quiénes vienen y en
 * cuántos lados— y lo que devuelve.
 */
export default function ConvocatoriaScreen() {
  const insets = useSafeAreaInsets();
  const { players, loading, error, refetch } = useReta();
  const { retas, save } = useRetas();
  const { nameOf, rename } = useTeamNames();
  const [called, setCalled] = useState<Set<number>>(new Set());
  const [guests, setGuests] = useState<Player[]>([]);
  const [count, setCount] = useState<"2" | "3" | "4">("2");
  const [result, setResult] = useState<BalancedTeams<Player> | null>(null);
  const [confirming, setConfirming] = useState(false);

  const teamCount = Number(count);

  // Los invitados van primero: acaban de escribirse y hay que verlos sin
  // buscar entre diecinueve fichas.
  const roster = useMemo(
    () => [...guests, ...(players ?? [])],
    [guests, players]
  );

  const squad = useMemo(
    () => roster.filter((player) => called.has(player.id)),
    [roster, called]
  );

  const keepers = squad.filter(canKeepGoal).length;
  const average =
    squad.length === 0
      ? 0
      : Math.round(
          squad.reduce((sum, player) => sum + player.overall, 0) / squad.length
        );
  const enough = squad.length >= teamCount * MIN_PER_TEAM;

  /** Cualquier cambio en la convocatoria invalida el reparto que se ve. */
  function reset<T>(value: T): T {
    setResult(null);
    return value;
  }

  function toggle(id: number) {
    setCalled((previous) => {
      const next = new Set(previous);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return reset(next);
    });
  }

  function toggleAll() {
    setCalled((previous) =>
      reset(
        previous.size === roster.length
          ? new Set<number>()
          : new Set(roster.map((player) => player.id))
      )
    );
  }

  function addGuest(input: { name: string; overall: number; keeper: boolean }) {
    const guest = makeGuest(input, guests);
    setGuests((previous) => [guest, ...previous]);
    // Se apunta convocado: nadie escribe un invitado para dejarlo fuera.
    setCalled((previous) => reset(new Set(previous).add(guest.id)));
  }

  function rateGuest(id: number, overall: number) {
    setGuests((previous) =>
      reset(
        previous.map((guest) =>
          guest.id === id ? { ...guest, overall } : guest
        )
      )
    );
  }

  function renameGuest(id: number, name: string) {
    const clean = name.trim();
    if (clean.length === 0) return;

    setGuests((previous) =>
      reset(
        previous.map((guest) =>
          guest.id === id
            ? // `displayName` en versales, igual que al crearlo: es lo que se
              // lee en el tablero y en la ficha.
              { ...guest, name: clean, displayName: clean.toUpperCase() }
            : guest
        )
      )
    );
  }

  function removeGuest(id: number) {
    setGuests((previous) => previous.filter((guest) => guest.id !== id));
    setCalled((previous) => {
      const next = new Set(previous);
      next.delete(id);
      return reset(next);
    });
  }

  function generate() {
    // El historial ya viene de la API, de la más nueva a la más vieja, que es
    // el orden en que el repartidor pesa los recuerdos.
    const next = balanceTeamsVaried(
      squad,
      toRecentSplits(retas ?? []),
      teamCount
    );
    setResult(next);

    // Guardar no bloquea: el reparto ya está en pantalla y lo que se persiste
    // es memoria para la próxima, no el resultado de esta. Si falla, la reta
    // sigue jugándose igual.
    // Los nombres del equipo viajan con el reparto: el historial guarda
    // "Jochis FC", no "Equipo A".
    save(toNewReta(next, { isGuest, nameOf })).catch(() => {
      // El historial se queda sin esta entrada; nada que el usuario pueda
      // arreglar ahora mismo.
    });
  }

  async function share() {
    if (result === null) return;
    await Share.share({ message: retaAsMessage(result, nameOf) });
  }

  // Repartir pide confirmación porque descarta el reparto anterior sin vuelta
  // atrás, y en el accesorio el botón queda justo donde descansa el pulgar.
  const shuffle: TabAction = {
    label: result === null ? "Repartir" : "Repartir otra vez",
    icon: "shuffle",
    onPress: () => setConfirming(true),
    disabled: !enough,
  };

  useTabAction(
    result === null
      ? [shuffle]
      : [{ label: "Compartir", icon: "share", onPress: share }, shuffle]
  );

  return (
    <ScrollView
      contentContainerStyle={{
        alignSelf: "center",
        width: "100%",
        maxWidth: MaxContentWidth,
        gap: Spacing.four,
        paddingHorizontal: Spacing.four,
        paddingTop: Spacing.three,
        paddingBottom: insets.bottom + AccessoryInset + Spacing.five,
      }}
      contentInsetAdjustmentBehavior="automatic"
      keyboardDismissMode="on-drag"
    >
      {error === null ? null : (
        <Notice
          actionLabel="Reintentar"
          detail={error}
          onAction={refetch}
          title="No pudimos leer la plantilla"
        />
      )}

      {result === null ? (
        <>
          <Surface style={{ gap: Spacing.three, padding: Spacing.four }}>
            <Text tone="accent" variant="eyebrow">
              Convocados
            </Text>

            <View
              style={{
                flexDirection: "row",
                alignItems: "baseline",
                gap: Spacing.two,
              }}
            >
              <Text variant="stat">{squad.length}</Text>
              <Text tone="muted" variant="body">
                de {roster.length}
              </Text>
            </View>

            <Text tone="muted" variant="caption">
              {squad.length === 0
                ? "Marca a quién viene hoy."
                : `Media de ${average} de overall · ${keepers} ${keepers === 1 ? "portero" : "porteros"}.`}
            </Text>

            <Segmented
              onChange={(value) => {
                setCount(value);
                setResult(null);
              }}
              options={COUNT_OPTIONS}
              value={count}
            />
          </Surface>

          <Section
            meta={
              roster.length === 0
                ? undefined
                : called.size === roster.length
                  ? "Ninguno"
                  : "Todos"
            }
            onMetaPress={toggleAll}
            title="Plantilla"
          >
            {roster.length === 0 ? (
              <Text tone="faint" variant="caption">
                {loading
                  ? "Cargando la plantilla…"
                  : "No hay a quién convocar."}
              </Text>
            ) : (
              <CallupGrid called={called} onToggle={toggle} players={roster} />
            )}
          </Section>

          <Section meta="De última hora" title="Invitados">
            <GuestList
              guests={guests}
              onAdd={addGuest}
              onRate={rateGuest}
              onRemove={removeGuest}
              onRename={renameGuest}
            />
          </Section>
        </>
      ) : (
        <>
          <RetaBoard nameOf={nameOf} onRename={rename} result={result} />

          {/* Repartir ya vive en el accesorio; aquí solo queda volver atrás. */}
          <Button
            icon="people"
            label="Cambiar convocatoria"
            onPress={() => setResult(null)}
            size="md"
            variant="ghost"
          />
        </>
      )}
      {confirming ? (
        <ConfirmDialog
          confirmLabel="Repartir"
          detail={
            result === null
              ? `Se arman ${teamCount} equipos con los ${squad.length} convocados.`
              : "Se descarta el reparto de ahora y se arma otro con los mismos convocados."
          }
          onClose={() => setConfirming(false)}
          onConfirm={generate}
          title={result === null ? "¿Repartir equipos?" : "¿Repartir otra vez?"}
        />
      ) : null}
    </ScrollView>
  );
}
