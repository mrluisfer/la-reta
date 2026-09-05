/**
 * Cómo se escribe el nombre de una persona.
 *
 * Vive en el paquete de dominio porque lo aplican los dos lados y tienen que
 * coincidir: la app para avisar mientras se escribe, el servidor para decidir.
 * Si solo validara el cliente, bastaría un `curl` para meter en la plantilla un
 * "🏴‍☠️ <script>" que después sale en el tablero, en el mensaje de WhatsApp y en
 * la carta.
 *
 * Se permite lo que de verdad aparece en un nombre —letras con tilde y ñ,
 * espacios, apóstrofo, guion y punto de abreviatura— y nada más. No es una
 * defensa contra inyección (de eso se encargan las consultas parametrizadas y
 * el escapado de React): es que un nombre con símbolos raros no es un nombre, y
 * la plantilla es una lista de personas que se saludan el jueves.
 */

/**
Letras de cualquier alfabeto, marcas de acento, y los signos de un nombre.
*/
const ALLOWED = /^[\p{L}\p{M}][\p{L}\p{M}\s'’.-]*$/u;

/**
Espacios de sobra fuera y en medio: "  Luis   Alvarez " → "Luis Alvarez".
*/
export function cleanPersonName(value: string): string {
  return value.replaceAll(/\s+/gu, " ").trim();
}

export const MIN_PERSON_NAME = 2;
export const MAX_PERSON_NAME = 60;

/**
 * `null` si el nombre sirve; si no, el motivo, ya escrito para enseñárselo a
 * quien lo tecleó. Devolver el texto y no un booleano evita que cada pantalla
 * invente su propia frase para la misma regla.
 */
export function personNameError(value: string): string | null {
  const name = cleanPersonName(value);

  if (name.length < MIN_PERSON_NAME) {
    return "Escribe al menos dos letras.";
  }
  if (name.length > MAX_PERSON_NAME) {
    return `Máximo ${MAX_PERSON_NAME} caracteres.`;
  }
  if (!ALLOWED.test(name)) {
    return "Usa solo letras, espacios, guiones y apóstrofos.";
  }
  return null;
}

export const isPersonName = (value: string): boolean =>
  personNameError(value) === null;
