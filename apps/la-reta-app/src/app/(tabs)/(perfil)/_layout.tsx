import { Stack } from "expo-router";

import { TabStack } from "@/components/tab-stack";

export default function PerfilLayout() {
  return (
    <TabStack>
      <Stack.Screen name="perfil" options={{ title: "Perfil" }} />
      <Stack.Screen name="diagnostico" options={{ title: "Diagnóstico" }} />

      {/* Hoja, no pantalla: se entra a tocar cuatro cosas y se sale. La misma
          presentación que la de orden y la de registro. */}
      <Stack.Screen
        name="cuenta"
        options={{
          headerShown: false,
          presentation: "formSheet",
          sheetAllowedDetents: [0.7],
          sheetGrabberVisible: true,
        }}
      />
    </TabStack>
  );
}
