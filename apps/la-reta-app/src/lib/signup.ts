import AsyncStorage from "@react-native-async-storage/async-storage";
import { File } from "expo-file-system";
import type { Position } from "@repo/reta/positions";

import { API_URL, authHeaders, request } from "@/lib/api";

/**
 * Pedir entrar a la plantilla.
 *
 * No es un alta: escribe en la cola de solicitudes que revisa un admin en la
 * web. Toda la interfaz tiene que hablar de "solicitud" —quien manda esto no
 * aparece en la lista al volver, y si la app insinúa lo contrario cerrará
 * pensando que algo falló.
 *
 * Quién puede pedir entrar se decide con dos preguntas, y en este orden:
 *
 *  1. **¿Ya tengo ficha?** `/api/v1/players/me` responde con el jugador
 *     vinculado a esta cuenta de Clerk. Si lo hay, no hay nada que pedir.
 *  2. **¿Ya la pedí?** Eso todavía no lo sabe el servidor —la solicitud queda
 *     en una cola y nadie consulta "mis solicitudes"—, así que la marca vive en
 *     el teléfono. Cubre la espera entre mandarla y que la aprueben, que es
 *     justo cuando la respuesta a la primera pregunta sigue siendo "no".
 */

const SENT_KEY = "reta.signup-sent.v1";

/**
 * Sube la foto y devuelve su URL.
 *
 * Manda los bytes a pelo, no un `multipart`. La pila de red de React Native no
 * sabe montar un `FormData` con un fichero del disco —falla con "Unsupported
 * FormDataPart implementation"—, y aquí no hay nada que multiplexar: es una
 * imagen y ya. El fichero se lee con `expo-file-system`, que sí sabe sacar el
 * `ArrayBuffer` de un `file://`.
 *
 * No pasa por `request()` porque ese helper serializa el cuerpo a JSON.
 *
 * El servidor la convierte a WebP acotado antes de guardarla, así que da igual
 * lo que suelte la cámara.
 */
export async function uploadPhoto(uri: string): Promise<string> {
  const bytes = await new File(uri).arrayBuffer();

  const response = await fetch(`${API_URL}/api/v1/uploads`, {
    method: "POST",
    headers: {
      ...(await authHeaders()),
      "content-type": "image/jpeg",
    },
    body: bytes,
  });

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload
        ? String((payload as { error: unknown }).error)
        : "No se pudo subir la foto.";
    throw new Error(message);
  }

  return (payload as { url: string }).url;
}

export type SignupInput = {
  name: string;
  displayName?: string;
  position: Position;
  position2?: Position;
  preferredFoot?: "left" | "right" | "both";
  contact?: string;
  note?: string;
  photoUrl?: string;
};

/**
 * La ficha de esta cuenta, si la hay.
 *
 * Devuelve `null` también cuando la petición falla: esto solo decide si se
 * ofrece registrarse, y quedarse sin botón por un fallo de red es peor que
 * ofrecerlo de más —lo segundo se corrige al enviar, que sí valida.
 */
export async function loadOwnedPlayerId(): Promise<number | null> {
  try {
    const { playerId } = await request<{ playerId: number | null }>(
      "/api/v1/players/me"
    );
    return playerId;
  } catch {
    return null;
  }
}

export async function sendSignup(input: SignupInput): Promise<void> {
  await request<{ id: number }>("/api/v1/player-signups", {
    method: "POST",
    body: input,
  });
  await AsyncStorage.setItem(SENT_KEY, new Date().toISOString());
}

/** Cuándo se mandó la última solicitud desde este teléfono, si es que hubo. */
export async function loadSignupSent(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(SENT_KEY);
  } catch {
    return null;
  }
}

export async function clearSignupSent(): Promise<void> {
  await AsyncStorage.removeItem(SENT_KEY);
}
