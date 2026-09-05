import { put } from "@vercel/blob";

import { getActor } from "@/lib/api/context";
import { handler, jsonError, jsonOk } from "@/lib/api/respond";
import { toWebp, webpName } from "@/lib/images";

export const dynamic = "force-dynamic";

export { preflight as OPTIONS } from "@/lib/api/respond";

/**
Una foto de celular cabe de sobra; el móvil ya manda recortado y comprimido.
*/
const MAX_BYTES = 6 * 1024 * 1024;

/**
 * Subir una imagen desde la app.
 *
 * Los bytes **sí** pasan por el servidor, al revés que el flujo de subida
 * directa del navegador. Es a propósito: ese flujo firma un token que solo
 * acepta WebP, y producir WebP en el teléfono pediría otra librería nativa. Por
 * aquí llega el JPEG que da la cámara y `toWebp` hace lo de siempre —girar por
 * EXIF, encajar en 1600 px sin agrandar, WebP q80—, así que en el store no
 * entra nada distinto de lo que ya había.
 *
 * El cuerpo es la imagen a pelo, sin `multipart`. React Native no sabe montar
 * un `FormData` con un fichero del disco en su pila de red nueva ("Unsupported
 * FormDataPart implementation"), y no hay nada que multiplexar: sube una
 * imagen y nada más.
 *
 * Pide cuenta porque escribe en el Blob store: sin sesión, cualquiera con la
 * URL puede llenarlo, y eso se paga.
 */
export const POST = handler(async (request) => {
  const { userId } = await getActor();
  if (userId === null) {
    return jsonError(request, "Necesitas una cuenta para subir fotos.", 401);
  }

  const type = request.headers.get("content-type") ?? "";
  if (!type.startsWith("image/")) {
    return jsonError(request, "Solo se permiten imágenes.", 400);
  }

  const bytes = await request.arrayBuffer();
  if (bytes.byteLength === 0) {
    return jsonError(request, "No se recibió ninguna imagen.", 400);
  }
  if (bytes.byteLength > MAX_BYTES) {
    return jsonError(request, "La imagen supera los 6 MB.", 400);
  }

  // `toWebp` valida de verdad que esto sea una imagen: sharp revienta con
  // cualquier otra cosa, y el `content-type` lo pone el cliente.
  const image = await toWebp(bytes);
  const blob = await put(`signups/${webpName("foto.jpg")}`, image.data, {
    access: "public",
    addRandomSuffix: true,
    contentType: image.contentType,
  });

  return jsonOk(request, { url: blob.url });
});
