import { getActor } from "@/lib/api/context";
import { INVALID_ID, parseId } from "@/lib/api/errors";
import { handler, jsonError, jsonOk } from "@/lib/api/respond";
import { getPlayerProfile } from "@/lib/queries";

export const dynamic = "force-dynamic";

export { preflight as OPTIONS } from "@/lib/api/respond";

interface Context {
  params: Promise<{ id: string }>;
}

/**
 * El rastro de un jugador: cómo han cambiado sus atributos, los premios que ha
 * votado la reta, las casacas que le han tocado y lo que le dicen los demás.
 *
 * Lectura pública, como el roster: nada de esto es privado —se vota y se
 * comenta a la vista de todos— y pedir sesión dejaría la ficha a medias para
 * quien solo entra a mirar. Si **hay** sesión se aprovecha para marcar cuáles
 * de los comentarios son suyos, que es lo que decide si puede editarlos.
 *
 * Va junto porque es una sola pantalla. Cuatro peticiones para pintar una ficha
 * significan cuatro esperas y cuatro maneras de quedarse a medias.
 */
export const GET = handler<Context>(async (request, context) => {
  const { id } = await context.params;
  const playerId = parseId(id);
  if (playerId === null) {
    return jsonError(request, INVALID_ID, 400);
  }

  const { userId } = await getActor();
  return jsonOk(request, await getPlayerProfile(playerId, userId));
});
