const MONTHS = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

/**
 * Fecha corta en español a partir del `date` de Postgres ("2025-03-08").
 *
 * Se formatea a mano en vez de con `Intl`: la cadena no lleva zona horaria y
 * pasarla por `new Date()` la interpreta en UTC, que al oeste de Greenwich
 * devuelve el día anterior. Partirla por guiones no tiene ese problema.
 */
export function formatMatchDate(iso: string): string {
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number);

  if (!year || !month || !day) return iso;

  return `${day} ${MONTHS[month - 1]} ${year}`;
}

/**
 * "20 ago", sin año.
 *
 * Es la fecha de un eje o de una etiqueta apretada, donde el año ya lo pone el
 * contexto y cuatro cifras más obligarían a girar el texto.
 */
export function formatShortDate(iso: string): string {
  const [, month, day] = iso.slice(0, 10).split("-").map(Number);

  if (!month || !day) return iso;

  return `${day} ${MONTHS[month - 1]}`;
}

/** Cifras sueltas de lo que se teclea; el resto lo pone la máscara. */
const NON_DIGITS = /\D/g;

const BIRTH_YEAR_FLOOR = 1900;
const MIN_BIRTH_AGE = 10;
const MAX_BIRTH_AGE = 120;

const pad2 = (value: number) => String(value).padStart(2, "0");

/**
 * Deja lo tecleado con forma de fecha: "12031990" se ve "12/03/1990".
 *
 * Se escribe a mano en vez de elegirla en un calendario porque una fecha de
 * nacimiento está treinta años atrás: llegar ahí girando ruedas o pasando meses
 * es mucho más lento que teclear ocho cifras con el teclado numérico.
 */
export function maskBirthDate(value: string): string {
  const digits = value.replace(NON_DIGITS, "").slice(0, 8);

  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)]
    .filter((part) => part.length > 0)
    .join("/");
}

/** "12/03/1990" tal como lo guarda Postgres, o `null` si aún no es una fecha. */
export function birthDateToIso(masked: string): string | null {
  const digits = masked.replace(NON_DIGITS, "");
  if (digits.length !== 8) return null;

  const day = Number(digits.slice(0, 2));
  const month = Number(digits.slice(2, 4));
  const year = Number(digits.slice(4, 8));

  // `Date` corrige a la brava —el 31 de febrero se convierte en marzo—, así que
  // se compara con lo tecleado en vez de fiarse de que no lanzó.
  const date = new Date(Date.UTC(year, month - 1, day));
  const real =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;

  if (!real || year < BIRTH_YEAR_FLOOR) return null;

  return `${year}-${pad2(month)}-${pad2(day)}`;
}

/** El camino de vuelta: de lo que guarda la base a lo que se ve en el campo. */
export function birthDateFromIso(iso: string | null | undefined): string {
  if (!iso) return "";

  const [year, month, day] = iso.slice(0, 10).split("-");
  if (!(year && month && day)) return "";

  return `${day}/${month}/${year}`;
}

/**
 * Años cumplidos, o `null` si la fecha no sirve. Es la misma cuenta que hace el
 * servidor al guardar, repetida aquí solo para poder enseñarla mientras se
 * escribe: la edad que acaba en la ficha siempre la calcula él.
 */
export function ageFromBirthDate(iso: string | null): number | null {
  if (iso === null) return null;

  const [year, month, day] = iso.split("-").map(Number);
  const today = new Date();
  let age = today.getFullYear() - year;

  const beforeBirthday =
    today.getMonth() + 1 < month ||
    (today.getMonth() + 1 === month && today.getDate() < day);
  if (beforeBirthday) age -= 1;

  return age >= MIN_BIRTH_AGE && age <= MAX_BIRTH_AGE ? age : null;
}
