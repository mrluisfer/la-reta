import { request } from "@/lib/api";

/**
 * Apuntar un turno de casacas.
 *
 * Quién lo apunta lo saca el servidor de la sesión; aquí solo viaja a quién le
 * tocó. Los de la plantilla van por id y los de última hora por nombre, que es
 * el mismo par que guarda la tabla.
 */
export async function recordCasaca(target: {
  playerId?: number;
  guestName?: string;
}): Promise<void> {
  await request("/api/v1/casacas", { method: "POST", body: target });
}
