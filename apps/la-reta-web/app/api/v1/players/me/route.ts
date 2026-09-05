import { getActor } from "@/lib/api/context";
import { handler, jsonOk } from "@/lib/api/respond";
import { getOwnedPlayerId } from "@/lib/queries";

export const dynamic = "force-dynamic";

export { preflight as OPTIONS } from "@/lib/api/respond";

/**
 * Qué ficha es de quien pregunta.
 *
 * Devuelve `{ playerId }` o `{ playerId: null }`, nunca un 404: "no tengo
 * ficha" es una respuesta legítima y la más común —la mayoría de las cuentas
 * nuevas—, no un fallo que el cliente tenga que interpretar.
 *
 * Sin sesión responde `null` en vez de 401 por lo mismo: el cliente pregunta
 * esto para decidir si ofrece registrarse, y un error ahí le obligaría a
 * distinguir entre "no tengo ficha" y "algo se rompió" para pintar un botón.
 */
export const GET = handler(async (request) => {
  const { userId } = await getActor();
  return jsonOk(request, { playerId: await getOwnedPlayerId(userId) });
});
