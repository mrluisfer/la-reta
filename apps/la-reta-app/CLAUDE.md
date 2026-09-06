# CLAUDE.md

@AGENTS.md

App nativa de La Reta. **Expo SDK 57 · expo-router (rutas tipadas) · React Native 0.86 · Reanimated 4 · react-native-svg · victory-native (Skia) · Clerk.**

No tiene base de datos ni lógica de servidor: todo sale de `/api/v1` de `apps/la-reta-web`. Lo que sí es suyo es cómo se ve y cómo se navega.

## Comandos

```bash
npx expo start                        # dev server
npx expo lint                         # linter (este workspace no usa Ultracite)
npx tsc --noEmit -p tsconfig.json     # tipos
```

No hay runner de tests. Lo que se comprueba se comprueba en el simulador.

## Datos

- **`useApi(path)`** (`hooks/use-api.ts`) es la capa entera: fetch con `pending`/`loading`/`error` y un cache **a nivel de módulo** por ruta. Ese cache no es optimización: cada pantalla monta su propio hook, así que sin él abrir una ficha desde la rejilla empezaba de cero y la transición de zoom de iOS aterrizaba en una pantalla en blanco. Mientras revalida se sigue viendo lo último que se supo.
- **`useReta()`** junta roster y partidos, que es lo que casi toda pantalla necesita a la vez. Casi todo lo demás se **deriva en el cliente** de esas dos listas (`lib/players.ts`, `lib/summary.ts`, `lib/series.ts`, `lib/match-analysis.ts`, `lib/reta-stats.ts`): el acta guarda una fila por participante aunque no marque, así que de ahí salen convocatorias, rachas, compañeros y perfiles de equipo sin pedir nada más.
- Solo se pide aparte lo que esas dos listas no traen: `use-player-profile`, `use-match-votes`, `use-casacas`, `use-retas`.
- El token de Clerk lo inyecta `setSessionTokenProvider` en `lib/api.ts`. Sin `ClerkProvider` la app sigue funcionando contra lo público en vez de reventar.

## Navegación

Pestañas nativas (`expo-router/unstable-native-tabs`) en `app/(tabs)/`. Dos patrones que hay que respetar:

- **Grupos compartidos.** `(inicio,plantilla,partidos)/jugador/[id]` es una pantalla que vive en las tres pilas: tocar a alguien desde Partidos abre su ficha _dentro de Partidos_ y volver regresa de donde saliste. Si una pantalla se abre desde varias pestañas, va en el grupo; no se duplica el archivo.
- **Pantallas de la raíz** (`casacas`, `retas`, `editar-ficha`, `calendario`) para lo que se abre desde sitios distintos. Las dos primeras llevan cabecera propia (`DETAIL_SCREEN` en `app/_layout.tsx`) porque la pila raíz va con `headerShown: false`; las otras dos son `formSheet`.

Ojo con las hojas: dentro de un `formSheet`, un `KeyboardAvoidingView` se queda sin alto y deja la hoja en blanco. Y Fast Refresh no vuelve a aplicar las opciones de `Stack.Screen`: si tocas una, recarga la app entera antes de creerte lo que ves.

## Cómo se ve

Los tokens están en `constants/theme.ts` y son la traducción exacta de los de la web, no una aproximación. Dos decisiones sostienen el resto: **papel hueso** detrás de tarjetas blancas, y **un solo acento** verde. El ámbar de las estrellas y las casacas es la única excepción, y está anotada donde se define.

Piezas, todas en `components/ui/`: `Text` (con `variant`, nunca `fontSize` a mano), `Surface`, `Section`, `Button`, `Field`, `Icon` (línea, 24 de retícula) y `ColorIcon` (a color, solo donde se elige un destino).

- Las cifras van en Oswald con `tabular-nums`. Interlineado mínimo 1.2 em o se come la tilde de la Ñ.
- **Nada de encajonar cada elemento de una lista.** La caja se gana cuando marca una zona pulsable —la rejilla de goleadores— no por decorar.
- Las gráficas son victory-native sobre Skia. Skia no ve las fuentes de `expo-font`: los ejes usan `useChartFont`, y cualquier cifra dentro de una gráfica va en `<Text>` de React Native superpuesto.
- **Una barra vale lo que mide**: toda gráfica de barras fija `domain={{ y: [0, máximo] }}`. Con el suelo pegado al mínimo, la barra más baja desaparece y el resto miente sobre su proporción.

## Lo que aporta ser nativo

Se usa donde cambia la experiencia, no para lucirlo: háptica en la ruleta de casacas (un tic por gajo, contado sobre el ángulo y no con un temporizador, porque la rueda frena), la transición de zoom de iOS al abrir una ficha, gestos de deslizar en la lista de invitados, `formSheet` nativas y la barra de pestañas de iOS 26 con su accesorio de cristal.
