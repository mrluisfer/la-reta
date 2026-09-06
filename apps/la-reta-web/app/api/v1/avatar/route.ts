// `sharp` exporta por defecto y además un nombre igual, y la regla no sabe
// cuál se quiso: renombrarlo dispara la contraria (`no-rename-default`). Se
// importa como en `lib/images.ts`, que es de donde sale el resto del
// tratamiento de imágenes de la app.
// eslint-disable-next-line import-x/no-named-as-default
import sharp from "sharp";

import { handler } from "@/lib/api/respond";

export const dynamic = "force-dynamic";

export { preflight as OPTIONS } from "@/lib/api/respond";

/**
 * Lado del retrato, en píxeles. 96 cubre una pestaña a 28 pt en pantalla 3x.
 */
const SIDE = 96;

/**
 * De dónde se acepta una imagen. La lista es la defensa: sin ella esto es un
 * proxy abierto y cualquiera puede usar el servidor para pedir URLs internas
 * o para gastar ancho de banda ajeno.
 */
const ALLOWED_HOSTS = new Set(["img.clerk.com", "images.clerk.dev"]);

/**
 * El retrato de una cuenta, recortado en círculo.
 *
 * Existe porque la barra de pestañas de iOS dibuja la imagen tal cual: no la
 * recorta ni la redondea, así que una foto cuadrada se ve cuadrada entre
 * iconos redondos. Enmascararla en el teléfono pediría otra librería nativa;
 * aquí ya está sharp, que es lo que convierte cualquier subida en WebP.
 *
 * No pide sesión a propósito: la carga el descargador de imágenes del sistema,
 * que no manda nuestras cabeceras. Tampoco hace falta — la URL de origen ya es
 * pública (es la que Clerk sirve a cualquier navegador) y esto solo la recorta.
 * Lo que sí hay es lista blanca de host, que es lo que impide que se use como
 * proxy para otra cosa.
 */
export const GET = handler(async (request) => {
  const url = new URL(request.url);
  const source = url.searchParams.get("u");
  if (source === null) {
    return new Response("Falta 'u'.", { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(source);
  } catch {
    return new Response("URL inválida.", { status: 400 });
  }

  if (target.protocol !== "https:" || !ALLOWED_HOSTS.has(target.hostname)) {
    return new Response("Origen no permitido.", { status: 400 });
  }

  const upstream = await fetch(target, { cache: "no-store" });
  if (!upstream.ok) {
    return new Response("No se pudo leer la imagen.", { status: 502 });
  }

  const mask = Buffer.from(
    `<svg width="${SIDE}" height="${SIDE}"><circle cx="${SIDE / 2}" cy="${SIDE / 2}" r="${SIDE / 2}" fill="#fff"/></svg>`
  );

  const png = await sharp(Buffer.from(await upstream.arrayBuffer()))
    .rotate()
    .resize(SIDE, SIDE, { fit: "cover" })
    // `dest-in` deja solo lo que cae dentro del círculo: el resto queda
    // transparente, que es lo que hace que se vea redonda y no un círculo
    // pintado sobre un cuadrado blanco.
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();

  return new Response(new Uint8Array(png), {
    headers: {
      "content-type": "image/png",
      // La foto de una cuenta cambia poquísimo, y la barra la pide en cada
      // arranque. Un día de caché ahorra esa ida y vuelta sin congelarla.
      "cache-control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
});
