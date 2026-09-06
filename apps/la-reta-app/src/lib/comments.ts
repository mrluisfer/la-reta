import { request } from "@/lib/api";

/**
 * Dejar una reseña sobre un jugador.
 *
 * Quién firma no viaja aquí: el servidor saca el nombre y la foto de la sesión
 * de Clerk que va en el token. Mandarlos desde el cliente sería dejar que
 * cualquiera firme como quien quiera.
 *
 * La API rechaza la reseña de uno mismo con un 403. La app también lo esconde,
 * pero esa es cortesía; la regla vive en el servidor.
 */
export async function postComment(
  playerId: number,
  input: { body: string; rating: number }
): Promise<void> {
  await request(`/api/v1/players/${playerId}/comments`, {
    method: "POST",
    body: input,
  });
}

/**
 * Corregir tu propio comentario.
 *
 * Quién puede lo decide el servidor con el `author_id` de la fila; la app solo
 * enseña el lápiz en los que ya vienen marcados como tuyos.
 */
export async function editComment(
  playerId: number,
  commentId: number,
  input: { body: string; rating: number }
): Promise<void> {
  await request(`/api/v1/players/${playerId}/comments/${commentId}`, {
    method: "PATCH",
    body: input,
  });
}
