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
