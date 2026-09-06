"use client";

import { useSyncExternalStore } from "react";

const subscribe = (onChange: () => void) => {
  document.addEventListener("visibilitychange", onChange);
  return () => {
    document.removeEventListener("visibilitychange", onChange);
  };
};

const getSnapshot = () => document.visibilityState === "visible";

/**
 * En el servidor no hay pestaña que ocultar.
 */
const getServerSnapshot = () => true;

/**
 * `true` mientras la pestaña está a la vista.
 *
 * Las tarjetas que rotan solas lo consultan para no seguir cambiando de jugador
 * en segundo plano: nadie lo ve, el navegador congela el frameloop —así que las
 * salidas de `AnimatePresence` no terminan y los nodos se apilan— y al volver a
 * la pestaña se descarga toda la cola de golpe.
 */
export const usePageVisible = () =>
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
