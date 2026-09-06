/**
 * La regla de las casacas: a quién le toca llevárselas.
 *
 * Quien lavó en las últimas retas queda **en descanso**, para que a nadie le
 * caiga dos veces seguidas. Entre el resto el sorteo es uniforme. Puro y con el
 * azar inyectable, así que se puede comprobar.
 *
 * Vive en el paquete compartido y no en una de las dos apps porque el sorteo
 * tiene que dar lo mismo en las dos: si la web excluye a los dos últimos y la
 * app a uno, el mismo grupo tendría dos reglas de justicia según por dónde
 * girase la ruleta.
 */

/**
How many of the most recent distinct winners sit out the next spin.
*/
export const RESTING_COUNT = 2;

/**
 * Ids eligible to be picked: everyone in `poolIds` except the last
 * `RESTING_COUNT` distinct winners. If that would lock everyone out (tiny pool),
 * the rule relaxes to the full pool so a spin is always possible.
 *
 * @param recentWinnerIds winners newest-first (index 0 = most recent).
 */
export function eligiblePlayerIds(
  poolIds: number[],
  recentWinnerIds: number[]
): number[] {
  const resting = new Set(recentWinnerIds.slice(0, RESTING_COUNT));
  const eligible = poolIds.filter((id) => !resting.has(id));
  return eligible.length > 0 ? eligible : [...poolIds];
}

/**
Sorteo uniforme entre los elegibles. `null` si no queda nadie.
*/
export function pickWinner(
  eligibleIds: number[],
  rng: () => number = Math.random
): number | null {
  if (eligibleIds.length === 0) {
    return null;
  }

  // `?? null` y no un índice a pelo: con `noUncheckedIndexedAccess` el acceso
  // es `number | undefined`, y aquí `undefined` y "no hay nadie" son la misma
  // respuesta para quien llama.
  return eligibleIds[Math.floor(rng() * eligibleIds.length)] ?? null;
}

/**
 * Vueltas enteras antes de frenar. Menos se siente amañado —la rueda apenas se
 * mueve— y más aburre a quien está esperando el nombre.
 */
const TURNS = 5;
const FULL_TURN = 360;

/**
 * A qué ángulo hay que llevar la ruleta para que el gajo `winnerIndex` acabe
 * centrado bajo la aguja de arriba. Siempre hacia adelante: `currentRotation`
 * es el ángulo de ahora, y lo que devuelve es mayor.
 *
 * Contrato de posición (ver la ruleta de cada cliente): el gajo `i` ocupa
 * `[i·seg, (i+1)·seg]` medido en el sentido del reloj desde arriba, así que su
 * centro cae en `(i + 0.5)·seg`. Cambiar eso en un cliente y no aquí hace que
 * la rueda pare en el vecino del elegido.
 */
export function rotationForWinner(
  winnerIndex: number,
  segmentCount: number,
  currentRotation: number
): number {
  const seg = FULL_TURN / segmentCount;
  const center = (winnerIndex + 0.5) * seg;

  // Dónde está ahora el centro del elegido respecto a la aguja.
  const offset =
    (((center + currentRotation) % FULL_TURN) + FULL_TURN) % FULL_TURN;
  // Lo que falta para subirlo hasta ella.
  const delta = (FULL_TURN - offset) % FULL_TURN;

  return currentRotation + TURNS * FULL_TURN + delta;
}
