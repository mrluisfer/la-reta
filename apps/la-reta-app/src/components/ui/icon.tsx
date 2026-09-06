import Svg, { Circle, Path } from "react-native-svg";

import { Palette } from "@/constants/theme";

/**
 * Iconos propios, dibujados sobre una retícula de 24 con trazo de 1.8 y remates
 * redondos.
 *
 * Son de línea y no rellenos para que convivan con una tipografía de peso medio
 * sin pesar más que ella. Se dibujan aquí en vez de tirar de SF Symbols porque
 * la app también corre en Android y en web, donde ese catálogo no existe, y una
 * librería de iconos entera pesaría más que estas nueve rutas.
 */

export type IconName =
  | "ball"
  | "jersey"
  | "trophy"
  | "calendar"
  | "chevron"
  | "arrow"
  | "shield"
  | "spark"
  | "pulse"
  | "person"
  | "people"
  | "star"
  | "flame"
  | "external"
  | "close"
  | "check"
  | "share"
  | "shuffle"
  | "search"
  | "sliders"
  | "alphabet"
  | "pencil"
  | "trash"
  | "refresh"
  | "camera"
  | "download"
  | "star-fill"
  | "eye"
  | "eye-off"
  | "pin";

export type IconProps = {
  name: IconName;
  size?: number;
  color?: string;
  /** Grosor del trazo; súbelo si el icono va junto a texto en negrita. */
  strokeWidth?: number;
};

export function Icon({
  name,
  size = 20,
  color = Palette.ink,
  strokeWidth = 1.8,
}: IconProps) {
  const stroke = {
    stroke: color,
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    fill: "none",
  };

  return (
    <Svg height={size} viewBox="0 0 24 24" width={size}>
      {name === "pin" ? (
        <>
          <Path
            d="M12 21.5c4-4.4 6-7.9 6-10.5a6 6 0 1 0-12 0c0 2.6 2 6.1 6 10.5Z"
            {...stroke}
          />
          <Circle cx={12} cy={10.8} r={2.4} {...stroke} />
        </>
      ) : null}

      {name === "eye" || name === "eye-off" ? (
        <>
          <Path
            d="M2.2 12S6 5.6 12 5.6S21.8 12 21.8 12S18 18.4 12 18.4S2.2 12 2.2 12Z"
            {...stroke}
          />
          <Circle cx={12} cy={12} r={3.2} {...stroke} />
          {name === "eye-off" ? <Path d="M4 20 L20 4" {...stroke} /> : null}
        </>
      ) : null}

      {name === "download" ? (
        <>
          {/* La bandeja abierta por arriba y la flecha entrando en ella: es el
              gesto de guardar, no el de mover algo hacia abajo. */}
          <Path
            d="M4 15.5v2.6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2.6"
            {...stroke}
          />
          <Path d="M12 3.8v11.4m-4.4-4.4L12 15.2l4.4-4.4" {...stroke} />
        </>
      ) : null}

      {name === "camera" ? (
        <>
          <Path d="M3 8.8h3.6l1.5-2.3h7.8l1.5 2.3H21v10.7H3z" {...stroke} />
          <Circle cx={12} cy={14} r={3.6} {...stroke} />
        </>
      ) : null}

      {name === "refresh" ? (
        <>
          {/* Flecha circular abierta con su punta maciza, como la de recargar
              de iOS. El arco se corta arriba a la izquierda: ahí encaja la
              punta, y cerrarlo del todo lo convertiría en un reloj. */}
          <Path
            d="M18.8 7.2 L17.8 6.1A9 9 0 1 0 20.5 15"
            {...stroke}
            strokeLinejoin="miter"
          />
          <Path
            d="M21.8 4.6 V9.8 A0.75 0.75 0 0 1 21 10.5 H15.8 C15.1 10.5 14.8 9.7 15.3 9.2 L20.5 4.1 C21 3.6 21.8 3.9 21.8 4.6 Z"
            fill={color}
            stroke="none"
          />
        </>
      ) : null}

      {name === "trash" ? (
        <>
          {/* Tapa, cuerpo y dos ranuras: la papelera de siempre. */}
          <Path d="M4 6.5 H20" {...stroke} />
          <Path d="M9.5 6.5 V4.5 H14.5 V6.5" {...stroke} />
          <Path d="M6.5 6.5 L7.4 19.5 H16.6 L17.5 6.5" {...stroke} />
          <Path d="M10.2 10 V16" {...stroke} />
          <Path d="M13.8 10 V16" {...stroke} />
        </>
      ) : null}

      {name === "pencil" ? (
        <>
          {/* El lápiz de editar: cuerpo en diagonal y punta cerrada. */}
          <Path d="M4 20 L4.8 16.2 L16 5 L19 8 L7.8 19.2 Z" {...stroke} />
          <Path d="M14 7 L17 10" {...stroke} />
        </>
      ) : null}

      {name === "alphabet" ? (
        <>
          {/* Una "A" y una flecha: el glifo de ordenar alfabéticamente. */}
          <Path d="M3.5 17.5 L7.5 6.5 L11.5 17.5" {...stroke} />
          <Path d="M5 13.5 H10" {...stroke} />
          <Path d="M17 5.5 V18" {...stroke} />
          <Path d="M14.3 15.3 L17 18 L19.7 15.3" {...stroke} />
        </>
      ) : null}

      {name === "search" ? (
        <>
          <Circle cx={11} cy={11} r={7} {...stroke} />
          <Path d="M16.2 16.2 L21 21" {...stroke} />
        </>
      ) : null}

      {name === "sliders" ? (
        <>
          {/* Tres carriles con su tirador, el glifo de filtro que todo el
              mundo ya reconoce de las apps que usa a diario. */}
          <Path d="M4 7 H20" {...stroke} />
          <Path d="M4 12 H20" {...stroke} />
          <Path d="M4 17 H20" {...stroke} />
          <Circle cx={9} cy={7} r={2.1} {...stroke} />
          <Circle cx={15} cy={12} r={2.1} {...stroke} />
          <Circle cx={8} cy={17} r={2.1} {...stroke} />
        </>
      ) : null}

      {name === "share" ? (
        <>
          {/* La flecha que sale de la caja: el gesto de compartir de iOS. */}
          <Path d="M12 3 V14.5" {...stroke} />
          <Path d="M8.5 6.5 L12 3 L15.5 6.5" {...stroke} />
          <Path d="M8 10.5 H5 V20 H19 V10.5 H16" {...stroke} />
        </>
      ) : null}

      {name === "shuffle" ? (
        <>
          <Path d="M3 6.5 H6.5 L17 17.5 H20" {...stroke} />
          <Path d="M3 17.5 H6.5 L17 6.5 H20" {...stroke} />
          <Path d="M17.5 4 L20 6.5 L17.5 9" {...stroke} />
          <Path d="M17.5 15 L20 17.5 L17.5 20" {...stroke} />
        </>
      ) : null}

      {name === "check" ? (
        <Path d="M4.5 12.5 L9.5 17.5 L19.5 6.5" {...stroke} />
      ) : null}

      {name === "ball" ? (
        <>
          <Circle cx={12} cy={12} r={9} {...stroke} />
          {/* El pentágono central y sus cinco radios: el balón clásico. */}
          <Path
            d="M12 7.8 L15.99 10.7 L14.47 15.4 L9.53 15.4 L8.01 10.7 Z"
            {...stroke}
          />
          <Path d="M12 7.8 V3" {...stroke} />
          <Path d="M15.99 10.7 L20.56 9.22" {...stroke} />
          <Path d="M14.47 15.4 L17.29 19.28" {...stroke} />
          <Path d="M9.53 15.4 L6.71 19.28" {...stroke} />
          <Path d="M8.01 10.7 L3.44 9.22" {...stroke} />
        </>
      ) : null}

      {name === "jersey" ? (
        <Path
          d="M9 3 L6 4 L3 7 L5.5 10 L6.6 9.4 L6.6 21 L17.4 21 L17.4 9.4 L18.5 10 L21 7 L18 4 L15 3 A3 3 0 0 1 9 3 Z"
          {...stroke}
        />
      ) : null}

      {name === "trophy" ? (
        <>
          <Path d="M8 4 H16 V9 A4 4 0 0 1 8 9 Z" {...stroke} />
          <Path d="M8 5 H5.5 A2.5 2.5 0 0 0 8.4 9.2" {...stroke} />
          <Path d="M16 5 H18.5 A2.5 2.5 0 0 1 15.6 9.2" {...stroke} />
          <Path d="M12 13 V16.5" {...stroke} />
          <Path d="M9.5 20.5 H14.5" {...stroke} />
          <Path d="M10 16.5 H14 V20.5" {...stroke} />
        </>
      ) : null}

      {name === "calendar" ? (
        <>
          <Path
            d="M4.5 5.5 H19.5 A1.5 1.5 0 0 1 21 7 V19.5 A1.5 1.5 0 0 1 19.5 21 H4.5 A1.5 1.5 0 0 1 3 19.5 V7 A1.5 1.5 0 0 1 4.5 5.5 Z"
            {...stroke}
          />
          <Path d="M8 3 V8" {...stroke} />
          <Path d="M16 3 V8" {...stroke} />
          <Path d="M3 11 H21" {...stroke} />
        </>
      ) : null}

      {name === "chevron" ? (
        <Path d="M9.5 5 L16.5 12 L9.5 19" {...stroke} />
      ) : null}

      {name === "close" ? (
        <>
          <Path d="M6.5 6.5 L17.5 17.5" {...stroke} />
          <Path d="M17.5 6.5 L6.5 17.5" {...stroke} />
        </>
      ) : null}

      {name === "arrow" ? (
        <>
          <Path d="M4 12 H19" {...stroke} />
          <Path d="M13 6 L19 12 L13 18" {...stroke} />
        </>
      ) : null}

      {/*
        "Esto sale de la app". Es la flecha en diagonal a secas, sin el
        marquito que suele acompañarla: a los 12 pt que mide en las fichas de
        acceso, el recuadro se convierte en una mancha y deja de leerse.
      */}
      {name === "external" ? (
        <>
          <Path d="M6.5 17.5 L17 7" {...stroke} />
          <Path d="M9 7 H17 V15" {...stroke} />
        </>
      ) : null}

      {name === "shield" ? (
        <Path
          d="M12 3 L20 6 V12 C20 16.5 16.5 19.5 12 21 C7.5 19.5 4 16.5 4 12 V6 Z"
          {...stroke}
        />
      ) : null}

      {name === "spark" ? (
        <Path
          d="M12 3 C12.6 8 15 10.4 21 12 C15 13.6 12.6 16 12 21 C11.4 16 9 13.6 3 12 C9 10.4 11.4 8 12 3 Z"
          {...stroke}
        />
      ) : null}

      {name === "pulse" ? (
        <Path d="M3 12 H7.5 L10 6 L14 18 L16.5 12 H21" {...stroke} />
      ) : null}

      {name === "person" ? (
        <>
          <Circle cx={12} cy={8.5} r={3.5} {...stroke} />
          <Path d="M5 20.5 A7 7 0 0 1 19 20.5" {...stroke} />
        </>
      ) : null}

      {name === "people" ? (
        <>
          <Circle cx={9.5} cy={8.5} r={3.3} {...stroke} />
          <Path d="M3.2 20.5 A6.3 6.3 0 0 1 15.8 20.5" {...stroke} />
          {/* El segundo asoma por detrás: media cabeza y medio hombro. */}
          <Path d="M16.2 5.4 A3.3 3.3 0 0 1 16.2 11.6" {...stroke} />
          <Path d="M17.4 14.4 A6.3 6.3 0 0 1 20.8 20" {...stroke} />
        </>
      ) : null}

      {name === "star" ? (
        <Path
          d="M12 3 L14.35 8.76 L20.56 9.22 L15.8 13.24 L17.29 19.28 L12 16 L6.71 19.28 L8.2 13.24 L3.44 9.22 L9.65 8.76 Z"
          {...stroke}
        />
      ) : null}

      {/* La misma estrella maciza. Una nota se cuenta con estrellas llenas: de
          contorno, un cinco sobre cinco se lee como cero. */}
      {name === "star-fill" ? (
        <Path
          d="M12 3 L14.35 8.76 L20.56 9.22 L15.8 13.24 L17.29 19.28 L12 16 L6.71 19.28 L8.2 13.24 L3.44 9.22 L9.65 8.76 Z"
          fill={color}
          stroke="none"
        />
      ) : null}

      {name === "flame" ? (
        <>
          {/* Contorno y lengua interior: con una sola curva se leía como una
              gota, no como una llama. */}
          <Path
            d="M12 2.6 C14.2 6.4 18 8 18 12.6 A6 6 0 0 1 6 12.6 C6 9.4 8.2 8.6 9.4 6.2 C10.1 7.8 10.6 8.4 11.2 8.8 C11.9 7.2 12 5 12 2.6 Z"
            {...stroke}
          />
          <Path
            d="M12 13 C13 14.4 13.6 15.2 13.6 16.4 A1.6 1.6 0 0 1 10.4 16.4 C10.4 15.4 11.2 14.6 12 13 Z"
            {...stroke}
          />
        </>
      ) : null}
    </Svg>
  );
}
