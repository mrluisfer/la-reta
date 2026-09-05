import { VENUE, venueQuery } from "@repo/reta/venue";
import * as Calendar from "expo-calendar";
import { Platform } from "react-native";

import { nextReta } from "@/lib/reta-date";
import { shareRetaInvite } from "@/lib/reta-invite";

/**
 * Mete la próxima reta en el calendario del teléfono.
 *
 * Abre la hoja de "Nuevo evento" del sistema ya rellenada en vez de escribir el
 * evento a la brava: el usuario ve qué se va a guardar, elige en qué calendario
 * y puede cambiar la hora si ese día se juega antes. Guardar a sus espaldas en
 * un calendario que ni eligió es de las cosas que hacen desinstalar una app.
 *
 * Se pide permiso de **solo escritura**: basta para crear el evento y no deja a
 * la app leer nada de lo que ya hay. En iOS 17+ el sistema lo enseña como tal,
 * así que el usuario ve que no vamos a fisgar su agenda.
 *
 * Si algo no está —web, Expo Go, permiso denegado, ningún calendario donde
 * escribir— cae al archivo `.ics` por la hoja de compartir, que funciona en
 * todas partes sin pedir nada.
 */

/** Aviso dos horas antes, que es cuando uno decide si va o no. */
const ALARM_OFFSET_MINUTES = -120;
/** Una reta dura sus dos horas de cancha. */
const DURATION_MS = 2 * 60 * 60 * 1000;

/**
 * Si el API de calendario existe siquiera.
 *
 * En Expo Go no existe: `expo-calendar` sustituye el módulo nativo por un stub
 * cuyos métodos son de instancia, y el paquete los reexporta desde la clase
 * (`export const requestCalendarPermissions = InternalExpoCalendar.requestCalendarPermissions`),
 * así que llegan aquí como `undefined`. Llamarlos reventaba con "undefined is
 * not a function" dentro de la promesa, sin que nadie lo recogiera.
 *
 * Se comprueba en vez de confiar en el `try`: así el camino de Expo Go es el
 * mismo que el de web —compartir el `.ics`— y no una excepción disfrazada.
 */
function hasCalendarApi(): boolean {
  return typeof Calendar.requestCalendarPermissions === "function";
}

/** El calendario donde escribir. iOS tiene uno por defecto; Android no. */
async function writableCalendar(): Promise<Calendar.ExpoCalendar | null> {
  if (Platform.OS === "ios") {
    return Calendar.getDefaultCalendarSync();
  }

  const calendars = await Calendar.getCalendars();
  return calendars.find((item) => item.allowsModifications) ?? null;
}

export async function addRetaToCalendar(): Promise<void> {
  if (Platform.OS === "web" || !hasCalendarApi()) {
    await shareRetaInvite();
    return;
  }

  try {
    const { granted } = await Calendar.requestCalendarPermissions(true);
    if (!granted) {
      await shareRetaInvite();
      return;
    }

    const calendar = await writableCalendar();
    if (calendar === null) {
      await shareRetaInvite();
      return;
    }

    const start = nextReta().kickoff;

    await calendar.addEventWithForm({
      title: "La Reta",
      startDate: start,
      endDate: new Date(start.getTime() + DURATION_MS),
      location: venueQuery(),
      notes: `Reta en ${VENUE.name}.`,
      alarms: [{ relativeOffset: ALARM_OFFSET_MINUTES }],
    });
  } catch {
    // Un teléfono sin app de calendario, un stub que revienta a mitad, lo que
    // sea: el usuario tocó "agregar al calendario" y algo tiene que llevarse.
    // Cancelar la hoja del sistema no pasa por aquí — eso resuelve, no lanza.
    await shareRetaInvite();
  }
}
