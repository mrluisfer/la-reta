import { eligiblePlayerIds, pickWinner, rotationForWinner } from "./casacas";

/**
 * Comprobación de la regla de las casacas.
 *
 * Va en un archivo aparte y no al final de `casacas.ts` por lo mismo que la del
 * balanceador: ese módulo lo empaqueta Metro para el móvil, y allí no existe
 * `process.argv`. Con el `if` de arranque dentro, la pantalla de la ruleta
 * reventaba al importarlo —expo-router solo decía "Cannot read property
 * 'ErrorBoundary' of undefined"—, que es un rato de depuración por una línea
 * que solo sirve en la terminal.
 *
 * Se corre con `npx tsx src/casacas.check.ts`.
 */

const assert = (condition: boolean, message: string) => {
  if (!condition) {
    throw new Error(`casacas check falló: ${message}`);
  }
};

/**
El descanso deja fuera a los dos últimos.
*/
const pool = [1, 2, 3, 4, 5];
assert(
  JSON.stringify(eligiblePlayerIds(pool, [5, 4])) === JSON.stringify([1, 2, 3]),
  "debería excluir a los dos últimos"
);

/**
Y se relaja si esa regla dejara a todos fuera.
*/
assert(
  eligiblePlayerIds([1, 2], [2, 1]).length === 2,
  "debería relajarse con un grupo pequeño"
);

/**
El sorteo se queda dentro de los elegibles y respeta el azar inyectado.
*/
assert(pickWinner([10, 20, 30], () => 0) === 10, "azar 0 → el primero");
assert(pickWinner([10, 20, 30], () => 0.99) === 30, "azar ≈1 → el último");
assert(pickWinner([]) === null, "grupo vacío → null");

/**
Al parar, el centro del elegido queda justo bajo la aguja.
*/
for (const count of [1, 3, 6, 11]) {
  for (let index = 0; index < count; index += 1) {
    const start = index * 37.5;
    const target = rotationForWinner(index, count, start);
    const center = (index + 0.5) * (360 / count);
    const atTop = (((center + target) % 360) + 360) % 360;

    assert(
      Math.abs(atTop) < 1e-6 || Math.abs(atTop - 360) < 1e-6,
      `el ${index} de ${count} debería quedar arriba (salió ${atTop})`
    );
    assert(target > start, "siempre gira hacia adelante");
  }
}

console.log("ok");
