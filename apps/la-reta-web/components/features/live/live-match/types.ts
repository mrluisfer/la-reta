import type { Position } from "@/lib/constants";

/**
 * Lo que hace falta saber de un jugador para atribuirle un gol en la cancha.
 *
 * No es solo el nombre a propósito: la lista se lee de pie, con prisa y a veces
 * sin conocer a quien acaba de anotar. La foto, la posición y el overall son lo
 * que convierte "Jorge Gonzalez" en alguien reconocible; con quince nombres
 * parecidos, el nombre solo no basta.
 */
export interface LivePlayer {
  id: number;
  name: string;
  /**
   * Apodo de la carta. Se enseña cuando aporta algo sobre el nombre.
   */
  displayName: string;
  photoUrl: string | null;
  position: Position;
  overall: number;
}

export { type LiveGoal, type LiveMatchState } from "@/lib/state/atoms";
