import type { PlayerSignupInput } from "@/app/actions/player-signups";
import { createPlayerSignup } from "@/app/actions/player-signups";
import { getActor } from "@/lib/api/context";
import { readJson } from "@/lib/api/errors";
import { handler, jsonError, jsonOk } from "@/lib/api/respond";

export const dynamic = "force-dynamic";

export { preflight as OPTIONS } from "@/lib/api/respond";

/**
 * Pedir entrar a la plantilla desde la app.
 *
 * No da de alta a nadie: escribe en `player_signups`, que es una cola con
 * estado y la revisa un admin en /admin/registros. La app tiene que contarlo
 * así —"solicitud enviada"— o la gente cerrará esperando verse en la lista.
 *
 * Pide cuenta, al revés que el formulario de la web, que es público. Ahí el
 * caso es alguien que llega por un enlace y no tiene por qué registrarse para
 * pedir entrar; aquí quien lo toca ya entró con su cuenta, así que exigirla no
 * cuesta nada y deja un actor identificado del lado del servidor para cuando
 * exista el vínculo cuenta↔ficha.
 */
export const POST = handler(async (request) => {
  const { userId } = await getActor();
  if (userId === null) {
    return jsonError(request, "Necesitas una cuenta para registrarte.", 401);
  }

  const body = await readJson<PlayerSignupInput>(request);
  // El tipo dice que estos dos vienen, pero esto es la red: lo que llega es lo
  // que el cliente haya querido mandar.
  if (
    body === null ||
    body.name.trim().length === 0 ||
    body.position.trim().length === 0
  ) {
    return jsonError(request, "Falta el nombre o la posición.", 400);
  }

  // El cuerpo no decide de quién es la solicitud: eso lo dice el token. Si
  // viniera del cliente, cualquiera podría pedir entrar a nombre de otro y
  // acabar con la ficha ajena vinculada a su cuenta.
  const result = await createPlayerSignup({ ...body, clerkUserId: userId });
  if (!result.ok) {
    return jsonError(request, result.error, 400);
  }

  return jsonOk(request, { id: result.id });
});
