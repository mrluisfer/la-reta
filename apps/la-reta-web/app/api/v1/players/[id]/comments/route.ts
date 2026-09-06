import { addPlayerComment } from "@/app/actions/comments";
import { getActor } from "@/lib/api/context";
import { INVALID_ID, parseId, readJson } from "@/lib/api/errors";
import { handler, jsonError, jsonOk } from "@/lib/api/respond";
import { getPlayerById } from "@/lib/queries";
import type { CommentInput } from "@/app/actions/comments";

export const dynamic = "force-dynamic";

export { preflight as OPTIONS } from "@/lib/api/respond";

interface Context {
  params: Promise<{ id: string }>;
}

/**
 * Dejar una reseña sobre un jugador.
 *
 * Quién la firma lo decide el token, no el cuerpo: `addPlayerComment` saca el
 * nombre y la foto de Clerk. Lo único que manda el cliente es el texto y la
 * nota.
 *
 * **Nadie se reseña a sí mismo.** La regla es de esta puerta y no de la acción
 * compartida a propósito: en la web la ficha de uno mismo no ofrece el
 * formulario, y cambiar la acción cambiaría también ese flujo. Aquí se
 * comprueba contra `clerkUserId` de la fila, que es el mismo dato con el que la
 * app decide si enseñar "Editar mi ficha" — así el cliente y el servidor dicen
 * lo mismo, y el que manda es este.
 */
export const POST = handler<Context>(async (request, context) => {
  const { userId } = await getActor();
  if (userId === null) {
    return jsonError(request, "Inicia sesión para dejar tu reseña.", 401);
  }

  const { id } = await context.params;
  const playerId = parseId(id);
  if (playerId === null) {
    return jsonError(request, INVALID_ID, 400);
  }

  const player = await getPlayerById(playerId);
  if (player === null) {
    return jsonError(request, "Jugador no encontrado.", 404);
  }
  if (player.clerkUserId === userId) {
    return jsonError(request, "No puedes reseñar tu propia ficha.", 403);
  }

  const body = await readJson<CommentInput>(request);
  if (body === null) {
    return jsonError(request, "Cuerpo inválido.", 400);
  }

  const result = await addPlayerComment(playerId, {
    body: body.body,
    rating: body.rating,
    client: body.client,
  });

  if (!result.ok) {
    return jsonError(request, result.error, 400);
  }

  return jsonOk(request, { ok: true }, 201);
});
