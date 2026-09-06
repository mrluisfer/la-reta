import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getActor } from "@/lib/api/context";
import { INVALID_ID, parseId, readJson } from "@/lib/api/errors";
import { handler, jsonError, jsonOk } from "@/lib/api/respond";
import { db, playerComments } from "@/lib/db";

export const dynamic = "force-dynamic";

export { preflight as OPTIONS } from "@/lib/api/respond";

interface Context {
  params: Promise<{ id: string; commentId: string }>;
}

interface Body {
  body?: string;
  rating?: number;
}

/**
 * El mismo tope que guarda la columna.
 */
const MAX_BODY = 500;
const MIN_RATING = 1;
const MAX_RATING = 5;

/**
 * Corregir tu propio comentario.
 *
 * La regla es una sola y la impone el `UPDATE`: la fila tiene que ser suya. Se
 * filtra por id **y** por `author_id` en la misma sentencia en vez de leer
 * primero y escribir después, así que no queda hueco entre comprobar y cambiar.
 * Si no vuelve fila, o no existe o no es suya, y las dos cosas responden lo
 * mismo para no ir diciendo qué comentarios hay.
 *
 * Solo el texto y la nota. El autor, su foto y la fecha son del momento en que
 * se escribió y no se tocan: un comentario editable de arriba abajo deja de ser
 * el registro de lo que alguien dijo.
 *
 * La lógica vive en esta ruta y no en `app/actions/comments.ts` a propósito.
 * Allí no había un "editar el propio" que reutilizar —solo borrar—, y la web
 * está en obras: dejarlo aquí mantiene el cambio dentro de `/api/v1`. Cuando la
 * web quiera editar también, esto sube a una acción compartida.
 */
export const PATCH = handler<Context>(async (request, context) => {
  const { userId } = await getActor();
  if (userId === null) {
    return jsonError(request, "Inicia sesión para editar tu reseña.", 401);
  }

  const { id, commentId } = await context.params;
  const playerId = parseId(id);
  const comment = parseId(commentId);
  if (playerId === null || comment === null) {
    return jsonError(request, INVALID_ID, 400);
  }

  const input = await readJson<Body>(request);
  if (input === null) {
    return jsonError(request, "Cuerpo inválido.", 400);
  }

  const body = input.body?.trim();
  if (body === undefined || body.length === 0) {
    return jsonError(request, "Escribe un comentario.", 400);
  }
  if (body.length > MAX_BODY) {
    return jsonError(request, `Máximo ${MAX_BODY} caracteres.`, 400);
  }

  const raw = input.rating;
  const rating =
    typeof raw === "number" && raw >= MIN_RATING && raw <= MAX_RATING
      ? Math.round(raw)
      : null;

  const updated = await db
    .update(playerComments)
    .set({ body, rating })
    .where(
      and(
        eq(playerComments.id, comment),
        eq(playerComments.playerId, playerId),
        eq(playerComments.authorId, userId),
        eq(playerComments.deleted, false)
      )
    )
    .returning({ id: playerComments.id });

  if (updated.length === 0) {
    return jsonError(request, "No puedes editar esta reseña.", 403);
  }

  revalidatePath(`/players/${playerId}`);
  return jsonOk(request, { ok: true });
});
