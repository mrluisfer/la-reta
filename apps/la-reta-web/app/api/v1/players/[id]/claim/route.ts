import { claimPlayer } from "@/app/actions/players";
import { getActor } from "@/lib/api/context";
import { INVALID_ID, parseId } from "@/lib/api/errors";
import { handler, jsonError, jsonOk } from "@/lib/api/respond";

export const dynamic = "force-dynamic";

export { preflight as OPTIONS } from "@/lib/api/respond";

interface Context {
  params: Promise<{ id: string }>;
}

/**
 * Reclamar una ficha para la cuenta que lo pide.
 *
 * Es la misma acción que usa la web (`claimPlayer`), con sus dos reglas: una
 * ficha con dueño no se le quita a nadie, y una cuenta no puede tener dos.
 * Quién reclama lo dice el token, nunca el cuerpo — si no, cualquiera podría
 * quedarse con la ficha ajena mandando otro id.
 */
export const POST = handler<Context>(async (request, context) => {
  const { userId } = await getActor();
  if (userId === null) {
    return jsonError(request, "Necesitas una cuenta para reclamar.", 401);
  }

  const { id } = await context.params;
  const playerId = parseId(id);
  if (playerId === null) {
    return jsonError(request, INVALID_ID, 400);
  }

  const result = await claimPlayer(playerId);
  if (!result.ok) {
    return jsonError(request, result.error, 409);
  }

  return jsonOk(request, { playerId });
});
