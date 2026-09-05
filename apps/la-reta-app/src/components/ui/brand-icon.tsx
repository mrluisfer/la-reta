import Svg, { Path } from "react-native-svg";

/**
 * Los logos de Google Maps y Apple, tal cual son.
 *
 * Van aparte del set de iconos de la app porque son marcas ajenas: el resto se
 * dibuja de línea, con un solo trazo y el color que le pase quien lo use, y
 * estos dos tienen que respetar su forma y sus colores o dejan de reconocerse
 * —que es justo lo que se busca al ponerlos en un menú de "abrir con".
 */

/**
 * La "G" de Google, con sus cuatro colores.
 *
 * Va el símbolo y no el logotipo completo: el botón ya dice "Continuar con
 * Google", y poner la palabra dos veces —una dibujada y otra escrita— se lee
 * como un error de maquetación. El símbolo solo es además lo que las guías de
 * marca permiten junto a un texto propio.
 */
export function GoogleMark({ size = 20 }: { size?: number }) {
  return (
    <Svg height={size} viewBox="0 0 128 128" width={size}>
      <Path
        d="M44.59 4.21a63.28 63.28 0 0 0 4.33 120.9a67.6 67.6 0 0 0 32.36.35a57.13 57.13 0 0 0 25.9-13.46a57.44 57.44 0 0 0 16-26.26a74.3 74.3 0 0 0 1.61-33.58H65.27v24.69h34.47a29.72 29.72 0 0 1-12.66 19.52a36.2 36.2 0 0 1-13.93 5.5a41.3 41.3 0 0 1-15.1 0A37.2 37.2 0 0 1 44 95.74a39.3 39.3 0 0 1-14.5-19.42a38.3 38.3 0 0 1 0-24.63a39.25 39.25 0 0 1 9.18-14.91A37.17 37.17 0 0 1 76.13 27a34.3 34.3 0 0 1 13.64 8q5.83-5.8 11.64-11.63c2-2.09 4.18-4.08 6.15-6.22A61.2 61.2 0 0 0 87.2 4.59a64 64 0 0 0-42.61-.38"
        fill="#fff"
      />
      <Path
        d="M44.59 4.21a64 64 0 0 1 42.61.37a61.2 61.2 0 0 1 20.35 12.62c-2 2.14-4.11 4.14-6.15 6.22Q95.58 29.23 89.77 35a34.3 34.3 0 0 0-13.64-8a37.17 37.17 0 0 0-37.46 9.74a39.25 39.25 0 0 0-9.18 14.91L8.76 35.6A63.53 63.53 0 0 1 44.59 4.21"
        fill="#e33629"
      />
      <Path
        d="M3.26 51.5a63 63 0 0 1 5.5-15.9l20.73 16.09a38.3 38.3 0 0 0 0 24.63q-10.36 8-20.73 16.08a63.33 63.33 0 0 1-5.5-40.9"
        fill="#f8bd00"
      />
      <Path
        d="M65.27 52.15h59.52a74.3 74.3 0 0 1-1.61 33.58a57.44 57.44 0 0 1-16 26.26c-6.69-5.22-13.41-10.4-20.1-15.62a29.72 29.72 0 0 0 12.66-19.54H65.27c-.01-8.22 0-16.45 0-24.68"
        fill="#587dbd"
      />
      <Path
        d="M8.75 92.4q10.37-8 20.73-16.08A39.3 39.3 0 0 0 44 95.74a37.2 37.2 0 0 0 14.08 6.08a41.3 41.3 0 0 0 15.1 0a36.2 36.2 0 0 0 13.93-5.5c6.69 5.22 13.41 10.4 20.1 15.62a57.13 57.13 0 0 1-25.9 13.47a67.6 67.6 0 0 1-32.36-.35a63 63 0 0 1-23-11.59A63.7 63.7 0 0 1 8.75 92.4"
        fill="#319f43"
      />
    </Svg>
  );
}

export function GoogleMapsMark({ size = 22 }: { size?: number }) {
  return (
    <Svg height={size} viewBox="0 0 24 24" width={size}>
      <Path
        d="M14.462.391a8.33 8.33 0 0 0-8.91 2.586l3.945 3.316Z"
        fill="#1a73e8"
      />
      <Path
        d="M5.552 2.977a8.3 8.3 0 0 0-1.947 5.356a9.3 9.3 0 0 0 .824 3.976l5.068-6.016Z"
        fill="#ea4335"
      />
      <Path
        d="M11.938 5.15a3.183 3.183 0 0 1 3.193 3.183a3.15 3.15 0 0 1-.762 2.06l4.964-5.902A8.36 8.36 0 0 0 14.461.37L9.497 6.293a3.16 3.16 0 0 1 2.441-1.143"
        fill="#4285f4"
      />
      <Path
        d="M11.938 11.526a3.193 3.193 0 0 1-3.193-3.193a3.16 3.16 0 0 1 .752-2.06l-5.068 6.035a29.5 29.5 0 0 0 3.78 5.408l6.18-7.323a3.16 3.16 0 0 1-2.451 1.133"
        fill="#fbbc04"
      />
      <Path
        d="M14.256 19.714c2.78-4.346 6.015-6.324 6.015-11.33a8.34 8.34 0 0 0-.938-3.842L8.21 17.716c.474.618.948 1.277 1.412 1.998c1.699 2.616 1.225 4.182 2.317 4.182s.618-1.566 2.317-4.182"
        fill="#34a853"
      />
    </Svg>
  );
}

export function AppleMark({
  size = 22,
  color = "#000000",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg height={size} viewBox="0 0 1024 1024" width={size}>
      <Path
        d="M747.4 535.7c-.4-68.2 30.5-119.6 92.9-157.5c-34.9-50-87.7-77.5-157.3-82.8c-65.9-5.2-138 38.4-164.4 38.4c-27.9 0-91.7-36.6-141.9-36.6C273.1 298.8 163 379.8 163 544.6c0 48.7 8.9 99 26.7 150.8c23.8 68.2 109.6 235.3 199.1 232.6c46.8-1.1 79.9-33.2 140.8-33.2c59.1 0 89.7 33.2 141.9 33.2c90.3-1.3 167.9-153.2 190.5-221.6c-121.1-57.1-114.6-167.2-114.6-170.7m-105.1-305c50.7-60.2 46.1-115 44.6-134.7c-44.8 2.6-96.6 30.5-126.1 64.8c-32.5 36.8-51.6 82.3-47.5 133.6c48.4 3.7 92.6-21.2 129-63.7"
        fill={color}
      />
    </Svg>
  );
}
