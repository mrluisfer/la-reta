import * as Haptics from "expo-haptics";
import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, G, Path, Text as SvgText } from "react-native-svg";

import { Palette } from "@/constants/theme";

export type WheelSegment = { id: number; label: string };

/**
 * Pasteles de la escala 300, los mismos que la ruleta de la web. Se ciclan por
 * índice, así que la posición de un color no significa nada: es solo lo que
 * separa un gajo del de al lado.
 */
const COLORS = [
  "#fca5a5",
  "#fdba74",
  "#fcd34d",
  "#bef264",
  "#86efac",
  "#5eead4",
  "#67e8f9",
  "#7dd3fc",
  "#93c5fd",
  "#a5b4fc",
  "#c4b5fd",
  "#d8b4fe",
  "#f0abfc",
  "#f9a8d4",
] as const;

/** Gris de quien descansa: se ve, pero se ve que no juega. */
const REST_FILL = "#E4E4E7";
const TEXT_DARK = "#3F3F46";
const TEXT_DIM = "#A1A1AA";

const VIEW = 200;
const CENTER = VIEW / 2;
const RADIUS = 92;
/** Cuánto dura el giro. Menos se siente tramposo; más, aburrido. */
const SPIN_MS = 3800;
/**
 * A partir de aquí el nombre no cabe en el gajo y se recorta. Con muchos
 * jugadores el gajo se estrecha, así que el corte también aprieta.
 */
const MAX_LABEL = 9;
const MAX_LABEL_TIGHT = 6;
/** Con más de esto, los gajos son cuñas y el nombre pide recorte y letra menor. */
const CROWDED = 12;

/**
 * La ruleta de las casacas.
 *
 * Es la misma pieza que la web —gajos pastel, puntero arriba, el elegido acaba
 * bajo la aguja— pero aquí gira en el hilo de la interfaz: la rotación es un
 * valor compartido de Reanimated, así que el giro no se entrecorta aunque la
 * pantalla esté cargando el historial por detrás.
 *
 * **Y hace tic.** Un golpe de motor cada vez que un gajo pasa bajo la aguja y
 * uno seco al parar. Es lo que una ruleta de verdad hace y lo que un móvil
 * puede dar y una web no: sin el tic, girar es ver una imagen moverse; con él,
 * se siente que está decidiendo.
 *
 * El contrato de posición es el de `@repo/reta/casacas`: el gajo `i` ocupa
 * `[i·seg, (i+1)·seg]` medido en el sentido del reloj desde arriba, así que su
 * centro cae en `(i + 0.5)·seg`. `rotationForWinner` cuenta con eso.
 */
export function CasacaWheel({
  segments,
  rotation,
  dimIndexes,
  onSpinEnd,
  size = 300,
}: {
  segments: WheelSegment[];
  /** Ángulo objetivo, en grados. Siempre crece: la ruleta nunca va hacia atrás. */
  rotation: number;
  /** Índices en descanso: se pintan en gris y no pueden salir. */
  dimIndexes: Set<number>;
  onSpinEnd: () => void;
  size?: number;
}) {
  const angle = useSharedValue(rotation);

  // El valor compartido es una referencia estable; listarlo impediría mutarlo.
  useEffect(() => {
    if (angle.value === rotation) return;

    angle.value = withTiming(
      rotation,
      // Arranca fuerte y se va muriendo, como una ruleta con rozamiento. Una
      // curva simétrica la haría parecer motorizada.
      { duration: SPIN_MS, easing: Easing.out(Easing.cubic) },
      (finished) => {
        if (finished) {
          runOnJS(onSpinEnd)();
          runOnJS(landed)();
        }
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ver arriba
  }, [rotation]);

  /**
   * Un tic por gajo que cruza la aguja.
   *
   * Se cuenta sobre el ángulo, no con un temporizador: el giro se frena, así
   * que un `setInterval` daría tics regulares mientras la rueda va cada vez más
   * lenta, y el oído —y el pulgar— notan enseguida que no se corresponden.
   */
  const step = segments.length === 0 ? 360 : 360 / segments.length;
  useAnimatedReaction(
    () => Math.floor(angle.value / step),
    (current, previous) => {
      if (previous === null || current === previous) return;
      runOnJS(tick)();
    }
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${angle.value}deg` }],
  }));

  const seg = segments.length === 0 ? 360 : 360 / segments.length;
  const crowded = segments.length > CROWDED;

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Animated.View style={[{ width: size, height: size }, animatedStyle]}>
        <Svg height={size} viewBox={`0 0 ${VIEW} ${VIEW}`} width={size}>
          {segments.map((segment, index) => {
            const start = index * seg;
            const end = start + seg;
            const resting = dimIndexes.has(index);
            const mid = start + seg / 2;
            const label = polar(mid, RADIUS * 0.9);
            // El nombre arranca en el arco y corre hacia el centro. En la
            // mitad derecha el mismo giro lo dejaría cabeza abajo, así que se
            // voltea media vuelta y se ancla por el otro extremo: ocupa la
            // misma cuña, en el mismo sentido, pero se lee del derecho.
            const flipped = mid > 0 && mid < 180;

            return (
              <G key={segment.id}>
                <Path
                  d={segmentPath(start, end)}
                  fill={resting ? REST_FILL : COLORS[index % COLORS.length]}
                  stroke={Palette.surface}
                  strokeWidth={1}
                />
                {/* Anclado al borde y leído hacia dentro.
                    Centrado a media altura, con diecinueve gajos los nombres
                    se cruzaban unos con otros: el gajo es una cuña y por el
                    medio no hay sitio. Pegado al arco, cada nombre ocupa la
                    parte ancha de su cuña y ninguno invade la de al lado. */}
                <SvgText
                  fill={resting ? TEXT_DIM : TEXT_DARK}
                  fontSize={crowded ? 7 : 9}
                  fontWeight="600"
                  origin={`${label.x}, ${label.y}`}
                  rotation={flipped ? mid - 90 : mid + 90}
                  textAnchor={flipped ? "end" : "start"}
                  x={label.x}
                  y={label.y}
                >
                  {shorten(segment.label, crowded)}
                </SvgText>
              </G>
            );
          })}

          <Circle
            cx={CENTER}
            cy={CENTER}
            fill={Palette.surface}
            r={16}
            stroke={Palette.line}
            strokeWidth={1}
          />
        </Svg>
      </Animated.View>

      {/* La aguja va fuera del giro, claro: es lo único que no se mueve. */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          alignItems: "center",
        }}
      >
        <Svg height={22} width={22}>
          <Path
            d="M11 20 L2 2 L20 2 Z"
            fill={Palette.ink}
            stroke={Palette.surface}
            strokeWidth={1.5}
          />
        </Svg>
      </View>
    </View>
  );
}

/** Golpecito seco al pasar un gajo. */
function tick() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

/** El que confirma que ya paró. */
function landed() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

/** Punto de la ruleta a `deg` grados, medidos en el reloj desde arriba. */
function polar(deg: number, r: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: CENTER + r * Math.cos(rad), y: CENTER + r * Math.sin(rad) };
}

function segmentPath(start: number, end: number) {
  const a = polar(start, RADIUS);
  const b = polar(end, RADIUS);
  const largeArc = end - start > 180 ? 1 : 0;
  return `M ${CENTER} ${CENTER} L ${a.x} ${a.y} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${b.x} ${b.y} Z`;
}

function shorten(label: string, crowded: boolean): string {
  const max = crowded ? MAX_LABEL_TIGHT : MAX_LABEL;
  return label.length > max ? `${label.slice(0, max - 1)}…` : label;
}
