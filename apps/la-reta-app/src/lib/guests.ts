import type { Position } from "@repo/reta/positions";

import type { Player } from "@/lib/types";

/**
 * Los de última hora: el primo, el vecino, el que llegó sin avisar.
 *
 * Se construyen como un `Player` entero para que atraviesen el repartidor y el
 * tablero igual que cualquiera, pero nunca se guardan en la plantilla — son de
 * esta reta y de ninguna más.
 *
 * El id negativo es lo que los distingue: la plantilla real viene de un
 * `serial` de Postgres, así que jamás baja de 1 y no hay forma de que dos
 * choquen.
 */

export const isGuest = (player: { id: number }) => player.id < 0;

/** Overall por defecto de un invitado: la media de una reta, ni crack ni bulto. */
export const DEFAULT_GUEST_OVERALL = 45;

export function makeGuest(
  input: { name: string; overall: number; keeper: boolean },
  existing: Player[]
): Player {
  const id = Math.min(0, ...existing.map((player) => player.id)) - 1;
  const overall = Math.max(1, Math.min(99, Math.round(input.overall)));
  const name = input.name.trim();
  // Un invitado juega de lo que haga falta; solo importa si ataja, porque de
  // eso depende que su equipo tenga portero.
  const position: Position = input.keeper ? "GK" : "CM";

  return {
    id,
    name,
    // Nombre completo en versales: el apodo de una palabra es cosa de la
    // plantilla, y "hermano de Luis" y "hermano de Pedro" tienen que poder
    // distinguirse en el tablero.
    displayName: name.toUpperCase().slice(0, 60),
    position,
    position2: null,
    nationality: "mx",
    photoUrl: null,
    birthDate: null,
    age: 25,
    heightCm: 175,
    weightKg: 70,
    preferredFoot: "right",
    pace: overall,
    shooting: overall,
    passing: overall,
    dribbling: overall,
    defending: overall,
    physical: overall,
    overall,
  };
}
