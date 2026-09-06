import { useApi, type ApiState } from "@/hooks/use-api";
import type { CasacaTurn } from "@/lib/types";

/**
 * El historial de turnos de casacas.
 *
 * Es lo que dibuja la lista y, sobre todo, **lo que decide quién descansa**: la
 * regla mira a los últimos ganadores, así que sin esta lista la ruleta no puede
 * ser justa. Por eso la pantalla espera a que llegue antes de dejar girar.
 */
export function useCasacas(): ApiState<CasacaTurn[]> {
  return useApi<CasacaTurn[]>("/api/v1/casacas");
}
