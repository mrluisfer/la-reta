import type { PlayerInput } from "@/app/actions/players";
import { updatePlayerInfo } from "@/app/actions/players";
import { getActor } from "@/lib/api/context";
import { INVALID_ID, parseId, readJson } from "@/lib/api/errors";
import { handler, jsonError, jsonOk } from "@/lib/api/respond";
import { getPlayerById } from "@/lib/queries";

export const dynamic = "force-dynamic";

export { preflight as OPTIONS } from "@/lib/api/respond";

interface Context {
  params: Promise<{ id: string }>;
}

/**
 * Una ficha suelta. Lectura pública, como el roster entero.
 */
export const GET = handler<Context>(async (request, context) => {
  const { id } = await context.params;
  const playerId = parseId(id);
  if (playerId === null) {
    return jsonError(request, INVALID_ID, 400);
  }

  const player = await getPlayerById(playerId);
  if (player === null) {
    return jsonError(request, "Jugador no encontrado.", 404);
  }

  return jsonOk(request, player);
});

/**
 * Editar la información de una ficha: quién eres, dónde juegas y tu físico.
 *
 * Es `updatePlayerInfo`, el mismo camino que la web da al dueño de un perfil,
 * con su regla intacta: **los seis atributos no se tocan**. La acción los relee
 * de la fila existente e ignora lo que mande el cliente, así que nadie se sube
 * el tiro por su cuenta; el overall se recalcula solo porque depende de la
 * posición, que sí es del dueño.
 *
 * Quién puede: el dueño de la ficha o un admin. Lo decide la acción a partir
 * del token, no del cuerpo.
 */
export const PATCH = handler<Context>(async (request, context) => {
  const { userId } = await getActor();
  if (userId === null) {
    return jsonError(request, "Necesitas una cuenta para editar.", 401);
  }

  const { id } = await context.params;
  const playerId = parseId(id);
  if (playerId === null) {
    return jsonError(request, INVALID_ID, 400);
  }

  const body = await readJson<PlayerInput>(request);
  if (body === null) {
    return jsonError(request, "Cuerpo inválido.", 400);
  }

  const result = await updatePlayerInfo(playerId, body);
  if (!result.ok) {
    return jsonError(request, result.error, 403);
  }

  return jsonOk(request, await getPlayerById(playerId));
});
