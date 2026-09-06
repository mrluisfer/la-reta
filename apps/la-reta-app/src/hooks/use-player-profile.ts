import { useApi, type ApiState } from "@/hooks/use-api";
import type { PlayerProfile } from "@/lib/types";

/**
 * El rastro de un jugador: atributos a lo largo del tiempo, premios votados,
 * casacas y comentarios.
 *
 * Es la única petición de la ficha que no sale del roster ya descargado, y por
 * eso llega aparte y más tarde: la carta, los goles y el hexágono se pintan al
 * instante con lo que ya hay, y esto rellena lo suyo cuando responde. Nada de
 * la pantalla espera por ello.
 */
export function usePlayerProfile(playerId: string): ApiState<PlayerProfile> {
  return useApi<PlayerProfile>(`/api/v1/players/${playerId}/profile`);
}
