import {
  eligiblePlayerIds,
  RESTING_COUNT,
  pickWinner,
  rotationForWinner,
} from "@repo/reta/casacas";
import { Stack, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";

import { CasacaWheel, type WheelSegment } from "@/components/casaca-wheel";
import { Notice } from "@/components/notice";
import { PlayerAvatar } from "@/components/player-avatar";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { Skeleton } from "@/components/ui/skeleton";
import { Surface } from "@/components/ui/surface";
import { Text } from "@/components/ui/text";
import {
  BottomTabInset,
  MaxContentWidth,
  Palette,
  Radius,
  Spacing,
} from "@/constants/theme";
import { useCasacas } from "@/hooks/use-casacas";
import { useReta } from "@/hooks/use-reta";
import { recordCasaca } from "@/lib/casacas";
import { formatMatchDate } from "@/lib/dates";
import type { CasacaTurn, Player } from "@/lib/types";

/** Con uno solo no hay sorteo que valga. */
const MIN_POOL = 2;
/** Cuántos turnos pasados enseña la lista. */
const HISTORY_SIZE = 8;

/**
 * A quién le toca llevarse las casacas.
 *
 * El sorteo es el mismo que el de la web —`@repo/reta/casacas`, compartido, no
 * copiado—: quien lavó en las dos últimas retas queda en descanso y entre el
 * resto se elige al azar. Si la regla dejara a todos fuera, se relaja; una
 * ruleta que no puede girar no es justa, es un error.
 *
 * **La app no guarda sola.** La web apunta el turno en cuanto la rueda para, y
 * deshacerlo pide un admin. Aquí, después de parar, el elegido aparece y hay
 * que confirmarlo: en la cancha pasa a menudo que el que sale ya se fue, y
 * volver a girar tiene que costar un toque, no una llamada al administrador.
 *
 * Vive en la raíz y no en una pestaña porque se abre desde el acceso rápido de
 * Inicio y no pertenece a ninguna de las cinco.
 */
export default function CasacasScreen() {
  const router = useRouter();
  const { players, pending: rosterPending, error, refetch } = useReta();
  const history = useCasacas();

  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [landed, setLanded] = useState<Player | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const pool = useMemo(() => players ?? [], [players]);

  /**
   * Los últimos ganadores distintos, del más reciente al más viejo.
   *
   * Solo cuentan los de la plantilla: un invitado puede no volver nunca, y
   * guardarle un turno de descanso sería reservar sitio a alguien que no está.
   */
  const recentWinnerIds = useMemo(() => {
    const out: number[] = [];
    for (const turn of history.data ?? []) {
      if (turn.playerId === null || out.includes(turn.playerId)) continue;
      out.push(turn.playerId);
      if (out.length >= RESTING_COUNT) break;
    }
    return out;
  }, [history.data]);

  const restingIds = useMemo(() => new Set(recentWinnerIds), [recentWinnerIds]);
  const resting = pool.filter((player) => restingIds.has(player.id));
  const dimIndexes = useMemo(() => {
    const out = new Set<number>();
    for (const [index, player] of pool.entries()) {
      if (restingIds.has(player.id)) out.add(index);
    }
    return out;
  }, [pool, restingIds]);

  const segments: WheelSegment[] = pool.map((player) => ({
    id: player.id,
    label: player.displayName,
  }));

  // No se gira hasta saber quién descansa: con el historial a medias la ruleta
  // podría sacar justo al que acaba de lavar.
  const ready = pool.length >= MIN_POOL && !history.pending && !spinning;

  function spin() {
    if (!ready) return;

    const eligible = eligiblePlayerIds(
      pool.map((player) => player.id),
      recentWinnerIds
    );
    const winnerId = pickWinner(eligible);
    if (winnerId === null) return;

    const index = pool.findIndex((player) => player.id === winnerId);
    if (index < 0) return;

    setLanded(null);
    setSaveError(null);
    setPendingId(winnerId);
    setSpinning(true);
    setRotation((current) => rotationForWinner(index, pool.length, current));
  }

  function onSpinEnd() {
    setSpinning(false);
    setLanded(pool.find((player) => player.id === pendingId) ?? null);
  }

  async function confirm() {
    if (landed === null) return;

    setSaving(true);
    setSaveError(null);
    try {
      await recordCasaca({ playerId: landed.id });
      setLanded(null);
      history.refetch();
    } catch (err: unknown) {
      setSaveError(
        err instanceof Error ? err.message : "No pudimos apuntar el turno."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={{
        alignSelf: "center",
        width: "100%",
        maxWidth: MaxContentWidth,
        gap: Spacing.five,
        paddingHorizontal: Spacing.four,
        paddingTop: Spacing.three,
        paddingBottom: BottomTabInset + Spacing.five,
      }}
      contentInsetAdjustmentBehavior="automatic"
    >
      <Stack.Screen options={{ title: "Casacas" }} />

      {error === null ? null : (
        <Notice
          actionLabel="Reintentar"
          detail={error}
          onAction={refetch}
          title="No pudimos leer la plantilla"
        />
      )}

      <View style={{ alignItems: "center", gap: Spacing.four }}>
        {rosterPending ? (
          <Skeleton height={300} />
        ) : (
          <CasacaWheel
            dimIndexes={dimIndexes}
            onSpinEnd={onSpinEnd}
            rotation={rotation}
            segments={segments}
          />
        )}

        {landed === null ? (
          <Button
            disabled={!ready}
            icon="shuffle"
            label={spinning ? "Girando…" : "Girar la ruleta"}
            onPress={spin}
          />
        ) : (
          // A lo ancho: dentro de una columna centrada la tarjeta se encogía a
          // lo que medía su contenido y los dos botones se quedaban en "O…" y
          // "C…". El envoltorio estira, y la tarjeta ya reparte por dentro.
          <View style={{ alignSelf: "stretch" }}>
            <Reveal>
              <Winner
                busy={saving}
                onConfirm={confirm}
                onRetry={spin}
                player={landed}
              />
            </Reveal>
          </View>
        )}

        {saveError === null ? null : (
          <Text tone="danger" variant="caption">
            {saveError}
          </Text>
        )}
      </View>

      {resting.length === 0 ? null : (
        <Section title="En descanso">
          <View
            style={{ flexDirection: "row", flexWrap: "wrap", gap: Spacing.two }}
          >
            {resting.map((player) => (
              <RestingChip key={player.id} player={player} />
            ))}
          </View>
          <Text tone="faint" variant="caption">
            Quien lavó las últimas {RESTING_COUNT} retas no entra al sorteo. Si
            la regla dejara a todos fuera, se relaja y vuelven a entrar todos.
          </Text>
        </Section>
      )}

      <Section
        meta={turnMeta(history.data?.length ?? 0)}
        title="A quién le tocó"
      >
        {history.pending ? (
          <Skeleton height={120} />
        ) : (
          <TurnList
            onOpen={(playerId) =>
              router.push({
                pathname: "/jugador/[id]",
                params: { id: String(playerId) },
              })
            }
            players={players}
            turns={(history.data ?? []).slice(0, HISTORY_SIZE)}
          />
        )}
      </Section>
    </ScrollView>
  );
}

/** "5 turnos" para la cabecera; nada cuando aún no hay ninguno. */
function turnMeta(count: number): string | undefined {
  if (count === 0) return undefined;
  return count === 1 ? "1 turno" : `${count} turnos`;
}

/**
 * El elegido, con lo que hay que decidir sobre él.
 *
 * Las dos salidas van juntas y con el mismo peso visual porque las dos son
 * normales: confirmar cuando está, volver a girar cuando ya se fue.
 */
function Winner({
  player,
  busy,
  onConfirm,
  onRetry,
}: {
  player: Player;
  busy: boolean;
  onConfirm: () => void;
  onRetry: () => void;
}) {
  return (
    <Surface style={{ alignItems: "center", gap: Spacing.three }}>
      <PlayerAvatar player={player} size={64} />

      <View style={{ alignItems: "center", gap: Spacing.half }}>
        <Text tone="faint" variant="eyebrow">
          Le toca a
        </Text>
        <Text variant="title">{player.displayName}</Text>
      </View>

      <View style={{ flexDirection: "row", gap: Spacing.two }}>
        <Button
          flex={1}
          icon="shuffle"
          label="Otra vez"
          onPress={onRetry}
          size="md"
          variant="ghost"
        />
        <Button
          flex={1}
          icon="check"
          label="Confirmar"
          loading={busy}
          onPress={onConfirm}
          size="md"
        />
      </View>
    </Surface>
  );
}

function RestingChip({ player }: { player: Player }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.two,
        paddingRight: Spacing.three,
        paddingVertical: Spacing.one,
        paddingLeft: Spacing.one,
        borderRadius: Radius.pill,
        backgroundColor: Palette.surfaceSunken,
      }}
    >
      <PlayerAvatar player={player} size={24} />
      <Text tone="muted" variant="caption">
        {player.displayName}
      </Text>
    </View>
  );
}

function TurnList({
  turns,
  players,
  onOpen,
}: {
  turns: CasacaTurn[];
  players: Player[] | null;
  onOpen: (playerId: number) => void;
}) {
  if (turns.length === 0) {
    return (
      <Text tone="faint" variant="caption">
        Todavía no le ha tocado a nadie.
      </Text>
    );
  }

  return (
    <Surface padded={false} style={{ paddingHorizontal: Spacing.three }}>
      {turns.map((turn, index) => (
        <TurnRow
          key={turn.id}
          last={index === turns.length - 1}
          onOpen={onOpen}
          player={players?.find((item) => item.id === turn.playerId) ?? null}
          turn={turn}
        />
      ))}
    </Surface>
  );
}

function TurnRow({
  turn,
  player,
  last,
  onOpen,
}: {
  turn: CasacaTurn;
  player: Player | null;
  last: boolean;
  onOpen: (playerId: number) => void;
}) {
  const row = (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.three,
        paddingVertical: Spacing.three,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: Palette.hairline,
      }}
    >
      {player === null ? (
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: Palette.surfaceSunken,
            borderWidth: 1,
            borderColor: Palette.line,
          }}
        >
          <Text tone="faint" variant="caption">
            {turn.displayName.slice(0, 2).toUpperCase()}
          </Text>
        </View>
      ) : (
        <PlayerAvatar player={player} size={38} />
      )}

      <View style={{ flex: 1, gap: Spacing.half }}>
        <Text numberOfLines={1} variant="bodyStrong">
          {turn.displayName}
        </Text>
        <Text tone="faint" variant="caption">
          {formatMatchDate(turn.createdAt)}
          {turn.spunByName === null ? "" : ` · giró ${turn.spunByName}`}
        </Text>
      </View>

      {player === null ? null : (
        <Icon color={Palette.inkFaint} name="chevron" size={14} />
      )}
    </View>
  );

  if (player === null) return row;

  return (
    <Pressable
      accessibilityLabel={`Abrir la ficha de ${turn.displayName}`}
      accessibilityRole="button"
      onPress={() => onOpen(player.id)}
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
    >
      {row}
    </Pressable>
  );
}
