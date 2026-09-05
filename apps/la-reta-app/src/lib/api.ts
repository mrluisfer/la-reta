import * as SecureStore from "expo-secure-store";

/**
 * Cliente de la API REST de la web (apps/la-reta-web, rutas /api/v1).
 *
 * Dos credenciales distintas viajan por caminos distintos, a propósito:
 *  - La sesión de Clerk va en `Authorization: Bearer`. El `auth()` del lado
 *    Next lee ese header igual que la cookie, así que el backend no distingue
 *    si la petición vino del navegador o de aquí.
 *  - El gate de PIN (admin / live) va en `x-reta-pin-token`. No puede usar
 *    `Authorization` porque ahí ya viaja Clerk, y no puede ser una cookie
 *    httpOnly como en la web porque aquí no hay navegador que la guarde.
 */

const PIN_TOKEN_KEY = "reta.pinToken";

/**
 * `expo-secure-store` es nativo: en web no hay keychain y sus métodos revientan
 * ("getValueWithKeyAsync is not a function"), lo que tumbaba *toda* petición,
 * incluidas las públicas. En un navegador el gate de PIN tampoco hace falta —
 * ahí manda la cookie httpOnly de la web—, así que se desactiva en vez de
 * inventarle un almacén menos seguro.
 */
const HAS_KEYCHAIN = process.env.EXPO_OS !== "web";

/** Configurable por entorno; en dev apunta al `next dev` de la máquina. */
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * Lo inyecta la capa de auth cuando exista ClerkProvider. Mientras tanto la
 * app funciona sin sesión contra los endpoints públicos, en vez de fallar.
 */
let getSessionToken: (() => Promise<string | null>) | null = null;

export function setSessionTokenProvider(
  provider: () => Promise<string | null>
) {
  getSessionToken = provider;
}

export async function getPinToken(): Promise<string | null> {
  if (!HAS_KEYCHAIN) return null;

  return SecureStore.getItemAsync(PIN_TOKEN_KEY);
}

export async function clearPinToken(): Promise<void> {
  if (!HAS_KEYCHAIN) return;

  await SecureStore.deleteItemAsync(PIN_TOKEN_KEY);
}

export async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};

  const session = await getSessionToken?.();
  if (session) headers.Authorization = `Bearer ${session}`;

  const pin = await getPinToken();
  if (pin) headers["x-reta-pin-token"] = pin;

  return headers;
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
};

export async function request<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, signal } = options;

  const response = await fetch(`${API_URL}${path}`, {
    method,
    signal,
    headers: {
      ...(body === undefined ? {} : { "content-type": "application/json" }),
      ...(await authHeaders()),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await response.text();
  const payload = text ? safeParse(text) : null;

  if (!response.ok) {
    // La API responde { error } en todos sus fallos; si llega otra cosa es que
    // algo devolvió HTML (una 404 de Next, un proxy), y conviene decirlo.
    const message =
      payload && typeof payload === "object" && "error" in payload
        ? String((payload as { error: unknown }).error)
        : `Respuesta no-JSON (${response.status})`;
    throw new ApiError(response.status, message);
  }

  return payload as T;
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * Canjea el PIN por un token firmado y lo guarda en el keychain. El PIN en sí
 * no se persiste: solo el token, que caduca.
 */
export async function exchangePin(
  pin: string,
  scope: "admin" | "live"
): Promise<void> {
  if (!HAS_KEYCHAIN) {
    throw new Error(
      "El canje de PIN solo funciona en la app nativa: en web no hay keychain donde guardar el token."
    );
  }

  const { token } = await request<{ token: string; expiresIn: number }>(
    "/api/v1/auth/pin",
    {
      method: "POST",
      body: { pin, scope },
    }
  );
  await SecureStore.setItemAsync(PIN_TOKEN_KEY, token);
}
