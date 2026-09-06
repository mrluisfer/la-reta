import { type ReactNode, useEffect } from "react";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

import { Motion } from "@/constants/theme";

/** Cuánto sube el bloque al aparecer, en puntos. */
const RISE = 10;

/**
 * Aparición corta para el contenido que llega tarde.
 *
 * La ficha pinta al instante lo que ya está descargado y rellena el resto
 * cuando responde el servidor. Sin esto, ese relleno es un salto seco: el
 * esqueleto se sustituye de golpe y el ojo lo lee como un parpadeo de error.
 * Con la subida corta se lee como lo que es, algo que acaba de llegar.
 *
 * Se anima un estilo con valores compartidos y no con `entering` de Reanimated
 * por la misma razón que en `Figure`: en web esas animaciones de layout
 * envuelven el elemento en una capa posicionada y lo sacan de su sitio.
 */
export function Reveal({
  delay = 0,
  children,
}: {
  /** Escalona varios bloques seguidos. En milisegundos. */
  delay?: number;
  children: ReactNode;
}) {
  const appear = useSharedValue(0);

  // El valor compartido es una referencia estable: listarlo en las
  // dependencias impediría mutarlo aquí dentro.
  useEffect(() => {
    appear.value = withDelay(delay, withTiming(1, { duration: Motion.base }));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ver arriba
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: appear.value,
    transform: [{ translateY: (1 - appear.value) * RISE }],
  }));

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}
