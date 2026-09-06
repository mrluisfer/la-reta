# Este Expo no es el que recuerdas

SDK 57. Lee los docs de esa versión exacta — <https://docs.expo.dev/versions/v57.0.0/> — antes de escribir código. Hay una copia local de lo esencial en `docs/expo-docs.md`, en la raíz del monorepo, con los malentendidos que los modelos repiten sobre Expo.

## Dos trampas que ya nos costaron una sesión

- **Metro empaqueta también `packages/*`.** Un módulo compartido no puede tener efectos de arranque de Node: un `if (process.argv[1]?.endsWith(...))` al final de un archivo revienta la pantalla que lo importe, y expo-router solo dice `Cannot read property 'ErrorBoundary' of undefined`. Los auto-tests van en un `*.check.ts` aparte.
- **Solo se inlinean las variables `EXPO_PUBLIC_*`.** Una clave con otro prefijo en `.env` llega como `undefined` en el bundle, y el fallo aparece como si el servicio estuviera mal configurado.

## Lint

Este workspace está fuera de Ultracite a propósito: lo linta `expo lint` (eslint-config-expo) desde aquí. `npx tsc --noEmit -p tsconfig.json` y `npx expo lint` tienen que quedar limpios antes de dar algo por hecho.
