import { useCallback, useMemo } from "react";

import { useApi } from "@/hooks/use-api";
import { summarize, type RetaSummary } from "@/lib/summary";
import type { Match, Player } from "@/lib/types";

export interface RetaState {
  players: Player[] | null;
  matches: Match[] | null;
  summary: RetaSummary;
  /** Hay una petición en vuelo. Con `pending` en falso es un refresco. */
  loading: boolean;
  /** Primera carga: no hay nada que enseñar todavía, toca el esqueleto. */
  pending: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Las dos lecturas públicas de la API, juntas, más las cifras derivadas.
 *
 * Van en un solo hook porque casi ninguna pantalla quiere una sin la otra: el
 * roster da la plantilla y los partidos dan los goles, y separarlas obligaría a
 * cada pantalla a repetir el mismo par de llamadas.
 */
export function useReta(): RetaState {
  const {
    data: players,
    error: playersError,
    loading: playersLoading,
    pending: playersPending,
    refetch: refetchPlayers,
  } = useApi<Player[]>("/api/v1/players");

  const {
    data: matches,
    error: matchesError,
    loading: matchesLoading,
    pending: matchesPending,
    refetch: refetchMatches,
  } = useApi<Match[]>("/api/v1/matches");

  const summary = useMemo(
    () => summarize(players, matches),
    [players, matches]
  );

  const refetch = useCallback(() => {
    refetchPlayers();
    refetchMatches();
  }, [refetchPlayers, refetchMatches]);

  return {
    players,
    matches,
    summary,
    loading: playersLoading || matchesLoading,
    // Basta con que una de las dos siga en blanco: media pantalla con datos y
    // media con avisos de "no hay nada" cuenta algo que aún no se sabe.
    pending: playersPending || matchesPending,
    // Si las dos fallan es por lo mismo (no hay backend), así que basta con
    // enseñar el primer error en vez de apilar dos avisos iguales.
    error: playersError ?? matchesError,
    refetch,
  };
}
