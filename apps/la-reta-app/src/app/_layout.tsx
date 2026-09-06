import "@/global.css";

import { DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { AuthProvider } from "@/components/auth-provider";
import { AnimatedSplashOverlay } from "@/components/splash-overlay";
import { Palette } from "@/constants/theme";
import { useAppFonts } from "@/hooks/use-app-fonts";

// El splash nativo lo oculta AnimatedSplashOverlay cuando su capa ya está
// pintada, para que el relevo entre los dos no parpadee.
SplashScreen.preventAutoHideAsync();

/**
 * La app tiene un solo tema, claro. Se le pasa a react-navigation para que los
 * fondos que dibuja él —cabeceras, transiciones entre pantallas— usen el mismo
 * papel que el resto y no un blanco puro que se note al empujar una vista.
 */
const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Palette.accent,
    background: Palette.paper,
    card: Palette.paper,
    text: Palette.ink,
    border: Palette.hairline,
  },
};

/**
 * Cabecera de las pantallas enteras que cuelgan de la raíz.
 *
 * Repite lo que `TabStack` da dentro de cada pestaña —papel de fondo, verde en
 * el botón de volver, etiqueta y no solo el chevron— porque la pila raíz no
 * pasa por ahí. Si algún día son tres o más, esto sube a un componente.
 */
const DETAIL_SCREEN = {
  headerShown: true,
  headerShadowVisible: false,
  headerTintColor: Palette.accent,
  headerStyle: { backgroundColor: Palette.paper },
  headerTitleStyle: { color: Palette.ink },
  headerBackButtonDisplayMode: "default",
  // Sin esto la etiqueta es el nombre del grupo de rutas —"(tabs)"—, que es
  // ruido interno. Genérico a propósito: a estas dos se llega desde Inicio y
  // desde Armar, así que nombrar un origen concreto mentiría la mitad de las
  // veces.
  headerBackTitle: "Atrás",
} as const;

export default function RootLayout() {
  const fontsReady = useAppFonts();

  return (
    /*
      Raíz de react-native-gesture-handler. Tiene que ser el elemento más
      externo y ocupar toda la pantalla: los gestos se resuelven en nativo
      contra el árbol que cuelga de aquí, así que cualquier GestureDetector
      montado fuera no recibiría eventos en Android.
    */
    <GestureHandlerRootView style={styles.root}>
      <AuthProvider>
        <ThemeProvider value={navigationTheme}>
          <StatusBar style="dark" />

          {/*
            El árbol espera a la tipografía. Una vista de texto nativa fija su
            familia al crearse y no vuelve a mirarla, así que cualquier pantalla
            montada antes de que Oswald cargue se quedaría con la del sistema
            aunque después re-renderice. La capa de bienvenida cubre esa espera,
            que es justo para lo que está.
          */}
          {fontsReady ? (
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: Palette.paper },
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="(auth)" options={{ presentation: "modal" }} />
              {/* Hoja a media altura: el calendario es una consulta rápida,
                  no una pantalla a la que se "entre". Ojo al depurarla: Fast
                  Refresh no vuelve a aplicar estas opciones, así que un cambio
                  aquí pide recargar la app entera antes de creerse lo que se
                  ve. */}
              {/* Editar la propia ficha. En la raíz porque se abre desde
                  Inicio, Plantilla y Buscar: colgada de una sola pila, volver
                  devolvería a la pestaña equivocada. */}
              <Stack.Screen
                name="editar-ficha"
                options={{
                  presentation: "formSheet",
                  sheetAllowedDetents: [0.9],
                  sheetGrabberVisible: true,
                }}
              />
              {/* Pantalla entera y no hoja: la ruleta es lo que se está
                  haciendo mientras dura, no una consulta rápida, y una hoja a
                  media altura le robaría el sitio al giro. */}
              {/* Dos pantallas enteras colgadas de la raíz, no hojas: se
                  abren desde varios sitios y colgarlas de una pestaña las
                  devolvería a la equivocada. Con cabecera propia, porque sin
                  ella la única salida sería el gesto del borde y no habría
                  título que dijera dónde está uno. */}
              <Stack.Screen name="casacas" options={DETAIL_SCREEN} />
              <Stack.Screen name="retas" options={DETAIL_SCREEN} />
              <Stack.Screen
                name="calendario"
                options={{
                  presentation: "formSheet",
                  sheetAllowedDetents: [0.78, 1],
                  sheetGrabberVisible: true,
                }}
              />
            </Stack>
          ) : null}

          {/* Va después del Stack para quedar por encima, y se desmonta solo. */}
          <AnimatedSplashOverlay ready={fontsReady} />
        </ThemeProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
