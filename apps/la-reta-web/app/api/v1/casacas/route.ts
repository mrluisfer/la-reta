import { recordCasacaSpin } from "@/app/actions/casacas";
import { readJson } from "@/lib/api/errors";
import { handler, jsonError, jsonOk } from "@/lib/api/respond";
import { getCasacaAssignments } from "@/lib/queries";

export const dynamic = "force-dynamic";

export { preflight as OPTIONS } from "@/lib/api/respond";

interface Body {
  playerId?: number;
  guestName?: string;
}

/**
 * Los turnos de casacas, del más reciente al más viejo.
 *
 * Lectura pública, como el roster: a quién le tocó lavar no es un secreto, y es
 * además lo que la ruleta necesita para saber quién descansa.
 */
export const GET = handler(async (request) =>
  jsonOk(request, await getCasacaAssignments())
);

/**
 * Apuntar un turno: el que salió en la ruleta, o el que se ofreció voluntario.
 *
 * Quién lo apunta lo decide el token —la acción exige sesión de Clerk o PIN de
 * admin y guarda el nombre de quien giró—, así que el cuerpo solo trae a quién
 * le tocó: `playerId` si está en la plantilla, `guestName` si vino de invitado.
 */
export const POST = handler(async (request) => {
  const body = await readJson<Body>(request);
  if (body === null) {
    return jsonError(request, "Cuerpo inválido.", 400);
  }

  const result = await recordCasacaSpin({
    playerId: body.playerId,
    guestName: body.guestName,
  });

  if (!result.ok) {
    // Sin sesión ni PIN la acción responde lo mismo que cualquier otro fallo de
    // validación, así que el 401 se distingue aquí por el texto: es lo único
    // que separa "no puedes" de "faltan datos" sin cambiar la acción, que la
    // web sigue llamando.
    const status = result.error.startsWith("Inicia sesión") ? 401 : 400;
    return jsonError(request, result.error, status);
  }

  return jsonOk(request, { ok: true, spunByName: result.spunByName }, 201);
});
