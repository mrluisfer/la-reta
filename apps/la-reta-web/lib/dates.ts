import dayjs, { type ConfigType } from "dayjs";
import "dayjs/locale/es-mx";

export const API_DATE_FORMAT = "YYYY-MM-DD";

dayjs.locale("es-mx");

function asDateOnly(value: string) {
  return dayjs(`${value}T12:00:00`).locale("es-mx");
}

export function formatApiDate(value?: ConfigType) {
  return dayjs(value).locale("es-mx").format(API_DATE_FORMAT);
}

export function formatShortDate(value: ConfigType) {
  return dayjs(value).locale("es-mx").format("DD MMM");
}

export function formatCompactDate(value: ConfigType) {
  return dayjs(value).locale("es-mx").format("DD MMM YY");
}

export function formatLongDate(value: ConfigType) {
  return dayjs(value).locale("es-mx").format("DD MMM YYYY");
}

export function formatShortDateOnly(value: string) {
  return asDateOnly(value).format("ddd DD MMM");
}

/**
 * La fecha partida en piezas, para maquetarla como un taco de calendario en vez
 * de como una línea de texto: es lo que deja distinguir un partido de otro sin
 * leer, cuando el historial es una pila de tarjetas casi idénticas.
 */
export function dateParts(value: string) {
  const d = asDateOnly(value);
  return {
    weekday: d.format("ddd"),
    day: d.format("DD"),
    month: d.format("MMM"),
    year: d.format("YYYY"),
  };
}

export function formatTime(value: ConfigType) {
  return dayjs(value).locale("es-mx").format("HH:mm");
}

/** Full years between a YYYY-MM-DD birth date and today. NaN if unparseable. */
export function ageFromBirthDate(value?: string | null) {
  if (!value) return Number.NaN;
  const d = asDateOnly(value);
  return d.isValid() ? dayjs().diff(d, "year") : Number.NaN;
}
