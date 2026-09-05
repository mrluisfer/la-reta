import { useSSO } from "@clerk/expo";
import { useRouter } from "expo-router";
import { useState } from "react";

import { GoogleMark } from "@/components/ui/brand-icon";
import { Button } from "@/components/ui/button";

/**
 * Entrada con Google por SSO de navegador.
 *
 * Es el único camino que funciona en Expo Go: las variantes nativas
 * (`useSignInWithGoogle`, los componentes prefabricados) necesitan una build de
 * desarrollo. `startSSOFlow` abre la sesión del navegador, resuelve el
 * intercambio y, si crea sesión, la activamos con `setActive`.
 *
 * Cancelar no es un error: resuelve con `createdSessionId: null`, y ahí no hay
 * nada que decirle al usuario.
 *
 * El botón lleva la "G" oficial con sus cuatro colores, no un dibujo de línea:
 * una marca ajena redibujada al estilo de la casa deja de reconocerse, que es
 * justo lo que se busca al ponerla. El logotipo completo no cabe aquí porque el
 * botón ya dice "Google" con letras.
 */
export function GoogleButton({
  onError,
  requireTerms = false,
  newsletter = false,
  onBlocked,
}: {
  onError: (message: string) => void;
  /** En el alta, mientras falte aceptar las condiciones. */
  requireTerms?: boolean;
  newsletter?: boolean;
  onBlocked?: () => void;
}) {
  const router = useRouter();
  const { startSSOFlow } = useSSO();
  const [busy, setBusy] = useState(false);

  const start = async () => {
    // Se avisa y no se abre el navegador: mandar a alguien a Google para
    // rebotarlo al volver es peor que decírselo antes de salir.
    if (requireTerms) {
      onBlocked?.();
      return;
    }

    setBusy(true);
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: "oauth_google",
        // Si el SSO acaba creando cuenta, la preferencia viaja con ella. En un
        // inicio de sesión normal Clerk ignora esto, que es lo correcto: no
        // debe pisar lo que el usuario ya haya elegido.
        unsafeMetadata: { newsletter },
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        router.replace("/inicio");
      }
    } catch (error) {
      onError(
        error instanceof Error
          ? error.message
          : "No pudimos abrir el acceso con Google."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      label="Continuar con Google"
      loading={busy}
      mark={<GoogleMark size={18} />}
      onPress={start}
      variant="ghost"
    />
  );
}
