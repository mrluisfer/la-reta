import { PlayerSheet } from "@/components/player-sheet";

/**
 * Ficha de jugador, compartida por Inicio, Plantilla y Partidos.
 *
 * El nombre del directorio `(inicio,plantilla,partidos)` es la sintaxis de
 * expo-router para una pantalla que vive en varias pilas a la vez: cada
 * pestaña se queda con su propio historial, así que tocar al crack desde
 * Inicio abre la ficha **dentro de Inicio** y volver regresa de donde saliste.
 * Antes esto eran dos ficheros con rutas distintas (`/ficha` y `/jugador`), que
 * funcionaba pero dejaba dos URLs para lo mismo.
 *
 * Partidos entró en el grupo cuando el acta se hizo tocable: desde ahí se abre
 * la ficha de un goleador, y sin estar en esa pila la navegación saltaba de
 * pestaña.
 */
export default function JugadorScreen() {
  return <PlayerSheet />;
}
