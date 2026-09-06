"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(pointer: fine)";

const subscribe = (onChange: () => void) => {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", onChange);
  return () => {
    mql.removeEventListener("change", onChange);
  };
};

const getSnapshot = () => window.matchMedia(QUERY).matches;

/**
En el servidor no hay puntero: asumir que no lo hay evita animar de más.
*/
const getServerSnapshot = () => false;

/**
 * `true` solo con un puntero de precisión (ratón/trackpad).
 *
 * `useSyncExternalStore` en vez de `useState` + efecto: el valor queda
 * disponible desde el primer render del cliente, sin un paso intermedio en el
 * que el componente cree que no hay ratón.
 */
export const useFinePointer = () =>
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
