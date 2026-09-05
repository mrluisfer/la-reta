import { useCallback, useEffect, useState } from "react";

import { request } from "@/lib/api";

/**
 * Fetch mínimo con estado de carga y error. La app aún no tiene una capa de
 * datos; cuando la tenga, esto se sustituye por TanStack Query (que la web ya
 * usa en la galería de jugadores) en vez de crecer aquí.
 *
 * `loading` se deriva en vez de guardarse: el resultado lleva la clave de la
 * petición que lo produjo, así que basta compararla con la clave actual. Eso
 * evita el `setState` síncrono dentro del efecto que React 19 desaconseja
 * (dispara un render en cascada).
 *
 * Mientras se vuelve a pedir se sigue enseñando lo último que se supo —dato o
 * error— en vez de vaciar la pantalla. Es lo que separa un "tirar para
 * actualizar" de un reinicio: el contenido se queda, y si la respuesta nueva
 * trae otra cosa se sustituye entera. Una respuesta vieja nunca se mezcla con
 * la nueva, porque siempre se enseña un resultado completo, no campos sueltos.
 *
 * `pending` es la primera carga y solo esa: no hay dato ni error todavía, así
 * que no hay nada que enseñar y toca el esqueleto. `loading` con `pending` en
 * falso es un refresco, y ese sí lleva el indicador de la lista.
 *
 * La última respuesta de cada ruta se guarda **fuera de React**, en el módulo.
 * Cada pantalla monta su propio hook, así que abrir una ficha desde la rejilla
 * arrancaba de cero y enseñaba "Cargando la ficha…" con el roster ya en
 * memoria — y con la transición de zoom de iOS eso se ve especialmente mal:
 * la carta crece hasta una página en blanco. Con el cache, la pantalla nueva
 * pinta al instante lo último que se supo y revalida por detrás.
 */

/**
 * Última respuesta por ruta, compartida por todas las pantallas.
 *
 * Vive mientras viva el proceso: no es persistencia, es no volver a empezar de
 * cero en cada pantalla. El tipo se pierde a la entrada —el mapa no puede ser
 * genérico— y se recupera al leer; cada ruta devuelve siempre la misma forma,
 * así que el cast es seguro mientras el `path` sea la clave.
 */
const cache = new Map<string, Omit<Result<unknown>, "key">>();

interface Result<T> {
  key: string;
  data: T | null;
  error: string | null;
}

export interface ApiState<T> {
  data: T | null;
  error: string | null;
  /** Hay una petición en vuelo, con o sin datos ya en pantalla. */
  loading: boolean;
  /** Primera carga: aún no se sabe nada de este recurso. */
  pending: boolean;
  refetch: () => void;
}

export function useApi<T>(path: string): ApiState<T> {
  const [nonce, setNonce] = useState(0);
  const [result, setResult] = useState<Result<T> | null>(null);

  const key = `${path}#${nonce}`;
  const refetch = useCallback(() => setNonce((value) => value + 1), []);

  useEffect(() => {
    // Aborta al desmontar o al re-pedir, para no llamar setState sobre un
    // componente ya desmontado.
    const controller = new AbortController();

    request<T>(path, { signal: controller.signal })
      .then((data) => {
        cache.set(path, { data, error: null });
        setResult({ key, data, error: null });
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        const error = err instanceof Error ? err.message : "Error desconocido";
        cache.set(path, { data: null, error });
        setResult({ key, data: null, error });
      });

    return () => controller.abort();
  }, [path, key]);

  const current = result?.key === key ? result : null;
  // Sin respuesta para la clave actual seguimos con la anterior, que es la que
  // ya está en pantalla; y si esta pantalla acaba de montarse, con lo que otra
  // dejó en el cache. `null` solo la primerísima vez en toda la sesión.
  const shown = current ?? result ?? (cache.get(path) as Result<T> | undefined);

  return {
    data: shown?.data ?? null,
    error: shown?.error ?? null,
    loading: current === null,
    pending: shown === null,
    refetch,
  };
}
