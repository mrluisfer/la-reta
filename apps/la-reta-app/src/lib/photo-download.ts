import { Directory, File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

import { photoSource } from "@/lib/photos";

/**
 * Guardar la foto de la ficha en el teléfono.
 *
 * Se baja a caché y se pasa a la hoja de compartir en vez de escribir en el
 * carrete con `expo-media-library`: ese módulo es nativo, obligaría a montar
 * otra build de desarrollo y pediría permiso sobre **todas** las fotos del
 * usuario para dejar una. Desde la hoja, "Guardar imagen" está a un toque y
 * además salen Archivos y AirDrop, que para una foto de perfil es justo lo que
 * la gente quiere hacer con ella.
 *
 * La caché es el sitio correcto: el archivo solo tiene que sobrevivir a la
 * hoja. En cuanto el sistema se lo lleva ya no le sirve a nadie, y el teléfono
 * puede tirarlo cuando le haga falta espacio.
 */
export async function downloadPhoto(photoUrl: string): Promise<void> {
  const remote = photoSource(photoUrl);
  if (remote === null) {
    throw new Error("Esta ficha no tiene foto.");
  }

  // En el navegador no hay hoja de compartir ni sistema de archivos: la
  // descarga de verdad es el atributo `download` de un enlace.
  if (Platform.OS === "web") {
    downloadInBrowser(remote);
    return;
  }

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error("Este teléfono no puede guardar archivos.");
  }

  const folder = new Directory(Paths.cache, "reta");
  folder.create({ idempotent: true });

  const target = new File(folder, fileNameFor(remote));
  // Bajar sobre un archivo que ya existe falla, y aquí el nombre se repite cada
  // vez que se toca el botón.
  if (target.exists) {
    target.delete();
  }

  const file = await File.downloadFileAsync(remote, target);

  await Sharing.shareAsync(file.uri, {
    mimeType: mimeFor(file.uri),
    // El tipo genérico: vale para WebP, JPEG y PNG, que son los tres que puede
    // haber guardados, y es el que hace que iOS ofrezca "Guardar imagen".
    UTI: "public.image",
    dialogTitle: "Guardar la foto",
  });
}

const IMAGE_TYPES: Record<string, string> = {
  webp: "image/webp",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
};

function extensionOf(url: string): string {
  // Las URL de Blob llevan cadena de consulta; el punto que importa es el del
  // último tramo de la ruta.
  const path = url.split("?")[0].split("/").at(-1) ?? "";
  return path.includes(".") ? (path.split(".").at(-1) ?? "") : "";
}

function mimeFor(url: string): string {
  return IMAGE_TYPES[extensionOf(url).toLowerCase()] ?? "image/jpeg";
}

/**
 * Un nombre estable y legible. El que trae la URL es el id que le puso el
 * servidor —"95.webp", o un hash de Blob—, y ese es el que acabaría viéndose en
 * Archivos y en el nombre del adjunto.
 */
function fileNameFor(url: string): string {
  const extension = extensionOf(url).toLowerCase();
  return `foto-la-reta.${extension in IMAGE_TYPES ? extension : "jpg"}`;
}

function downloadInBrowser(url: string): void {
  const link = document.createElement("a");
  link.href = url;
  link.download = fileNameFor(url);
  link.rel = "noopener";
  link.click();
}
