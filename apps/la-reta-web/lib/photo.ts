/**
 * Hosts que el optimizador de imágenes acepta, en espejo de `remotePatterns`
 * en `next.config.ts`. Si se añade uno allí, se añade aquí.
 */
const OPTIMIZABLE_HOSTS = new Set(["img.clerk.com", "images.clerk.dev"]);
const BLOB_HOST_SUFFIX = ".public.blob.vercel-storage.com";

function hostnameOf(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return "";
  }
}

/**
 * El optimizador de next/image solo acepta rutas propias y los hosts que
 * declara `remotePatterns`. El formulario de jugador deja pegar una URL
 * cualquiera ("…o pega una URL: https://…"), y con esa el optimizador responde
 * 400 y la foto se queda en blanco: esas se sirven tal cual.
 */
export function isOptimizablePhoto(url: string) {
  if (url.startsWith("/")) {
    return true;
  }
  const hostname = hostnameOf(url);
  if (hostname === "") {
    return false;
  }
  return hostname.endsWith(BLOB_HOST_SUFFIX) || OPTIMIZABLE_HOSTS.has(hostname);
}

/**
 * Anchos que sirve el optimizador (`imageSizes` + `deviceSizes` de Next).
 * Pedir uno que no esté en la lista devuelve 400.
 */
const NEXT_WIDTHS = [16, 32, 48, 64, 96, 128, 256, 384] as const;
const MAX_WIDTH = 384;

/**
 * Ancho por defecto de un avatar: cubre `size-8`/`size-10` a 2–3x.
 */
export const AVATAR_WIDTH = 128;

/**
 * Pasa una foto por el optimizador al ancho en que de verdad se pinta.
 *
 * Los avatares son círculos de 24–96 px, pero la fuente es la misma foto de
 * ficha que sube el jugador —hasta 1054×1492, o sea ~6 MB de bitmap
 * descomprimido por círculo—. Una alineación de veinte jugadores llegaba así a
 * más de 100 MB de memoria de imagen para dibujar miniaturas.
 *
 * No se usa `next/image` porque `Avatar.Image` de Base UI lleva su propia
 * máquina de estados —es la que decide cuándo enseñar el `AvatarFallback`— y
 * envolverla la rompería. Lo único que hace falta cambiar es la URL.
 */
export function avatarSource(url: string, width: number = AVATAR_WIDTH) {
  if (!isOptimizablePhoto(url)) {
    return url;
  }
  const served =
    NEXT_WIDTHS.find((candidate) => candidate >= width) ?? MAX_WIDTH;
  return `/_next/image?url=${encodeURIComponent(url)}&w=${served}&q=75`;
}
