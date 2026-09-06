"use client";

import { useSyncExternalStore } from "react";

const noop = () => {
  // El valor no cambia nunca tras la hidratación, así que no hay a qué
  // suscribirse: `getSnapshot` ya devuelve `true` en cliente y `false` en el
  // servidor, y con eso basta para distinguir los dos pases.
};

const subscribe = () => noop;
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export function useHydrated() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
