"use client";

import {
  RESTING_COUNT,
  eligiblePlayerIds,
  pickWinner,
  rotationForWinner,
} from "@repo/reta/casacas";
import { useAtom } from "jotai";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { CasacaAssignmentRow } from "@/lib/queries";
import type { Player } from "@/lib/db/schema";
import type { WheelSegment } from "@/components/features/casacas/wheel";
import { guestsAtom, selectedIdsAtom } from "@/lib/state/atoms";
import { isGuest } from "@/lib/guests";
import { recordCasacaSpin } from "@/app/actions/casacas";

export type CasacaWheel = ReturnType<typeof useCasacaWheel>;

/**
 * All the state + business logic behind the casacas wheel: which players are in
 * play, who's resting, the spin animation, and persisting the winner. The UI
 * components stay presentational and read from what this returns.
 */
export function useCasacaWheel({
  players,
  assignments,
  canManage,
}: {
  players: Player[];
  assignments: CasacaAssignmentRow[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useAtom(selectedIdsAtom);
  const [guests, setGuests] = useAtom(guestsAtom);

  // Wheel pool = roster picked in /teams (or the whole roster if none picked)
  // plus every last-minute guest, so guests can wash the casacas too.
  const pool = useMemo(() => {
    const set = new Set(selectedIds);
    const picked = players.filter((p) => set.has(p.id));
    const roster = picked.length > 0 ? picked : players;
    return [...roster, ...guests];
  }, [players, selectedIds, guests]);

  // Last distinct roster winners sit out (newest first). Guests never accumulate
  // rest turns (they may not return), so they stay eligible — acceptable ceiling.
  const recentWinnerIds = useMemo(() => {
    const out: number[] = [];
    for (const assignment of assignments) {
      const id = assignment.playerId;
      if (id !== null && !out.includes(id)) {
        out.push(id);
      }
    }
    return out.slice(0, RESTING_COUNT);
  }, [assignments]);

  const restingSet = useMemo(
    () => new Set(recentWinnerIds.slice(0, RESTING_COUNT)),
    [recentWinnerIds]
  );
  const dimIndexes = useMemo(() => {
    const out = new Set<number>();
    for (const [index, player] of pool.entries()) {
      if (restingSet.has(player.id)) {
        out.add(index);
      }
    }
    return out;
  }, [pool, restingSet]);
  const restingPlayers = useMemo(
    () => pool.filter((p) => restingSet.has(p.id)),
    [pool, restingSet]
  );

  const segments: WheelSegment[] = useMemo(
    () => pool.map((p) => ({ id: p.id, label: p.displayName })),
    [pool]
  );

  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<Player | null>(null);
  const [pendingWinnerId, setPendingWinnerId] = useState<number | null>(null);

  const canSpin = canManage && pool.length >= 2 && !spinning;

  function spin() {
    if (!canSpin) {
      return;
    }
    const eligible = eligiblePlayerIds(
      pool.map((p) => p.id),
      recentWinnerIds
    );
    const winnerId = pickWinner(eligible);
    if (winnerId == null) {
      return;
    }
    const index = pool.findIndex((p) => p.id === winnerId);
    if (index === -1) {
      return;
    }

    setWinner(null);
    setPendingWinnerId(winnerId);
    setSpinning(true);
    setRotation((r) => rotationForWinner(index, pool.length, r));
  }

  async function onSpinEnd() {
    setSpinning(false);
    const id = pendingWinnerId;
    if (id == null) {
      return;
    }
    const won = pool.find((p) => p.id === id) ?? null;
    setWinner(won);
    if (!won) {
      return;
    }

    const saved = await recordCasacaSpin(
      isGuest(won) ? { guestName: won.displayName } : { playerId: won.id }
    );
    if (saved.ok) {
      router.refresh();
    } else {
      toast.error(saved.error);
    }
  }

  /**
   * Quita a un invitado de última hora. Es el mismo estado que usa Armar
   * equipos (`guestsAtom` + `selectedIdsAtom`), así que desaparece de la reta
   * completa, no solo de esta ruleta. Los turnos que ya ganó quedan en el
   * historial: eso ya pasó.
   */
  function removeGuest(id: number) {
    if (!canManage || spinning) {
      return;
    }
    setGuests((previous) => previous.filter((g) => g.id !== id));
    setSelectedIds((previous) => previous.filter((x) => x !== id));
    if (winner?.id === id) {
      setWinner(null);
    }
  }

  // Assign the turn manually (someone volunteers) — no spin, but picks from the
  // same pool so the current list is respected.
  async function assignManual(id: number) {
    if (!canManage || spinning) {
      return;
    }
    const chosen = pool.find((p) => p.id === id) ?? null;
    if (!chosen) {
      return;
    }
    const saved = await recordCasacaSpin(
      isGuest(chosen)
        ? { guestName: chosen.displayName }
        : { playerId: chosen.id }
    );
    if (saved.ok) {
      setWinner(chosen);
      router.refresh();
    } else {
      toast.error(saved.error);
    }
  }

  return {
    pool,
    selectedCount: selectedIds.length,
    guestPlayers: guests,
    restingPlayers,
    dimIndexes,
    segments,
    rotation,
    spinning,
    winner,
    canManage,
    canSpin,
    spin,
    assignManual,
    removeGuest,
    onSpinEnd,
    dismissWinner: () => {
      setWinner(null);
    },
  };
}
