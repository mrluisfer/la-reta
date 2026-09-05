import { Stack } from "expo-router";

import { TabStack } from "@/components/tab-stack";

export default function PlantillaLayout() {
  return (
    <TabStack>
      <Stack.Screen name="plantilla" options={{ title: "Plantilla" }} />
      {/* Compartida entre pestañas; el título lo pone la propia ficha. */}
      <Stack.Screen name="jugador/[id]" />
      <Stack.Screen name="partido/[id]" />

      {/* Hoja nativa, como el calendario: la presenta iOS con su arrastre y su
          cierre por gesto.

          Sin cabecera: dentro de una hoja `fitToContents`, la barra de título
          entraba en la medición y el resultado no cuadraba con lo dibujado —la
          primera fila se quedaba tapada y sobraba hueco abajo—. El título va
          dentro del contenido, que además es lo que hacen las hojas del
          sistema. */}
      {/* Misma presentación que la hoja de orden: entra desde abajo, se cierra
          con el gesto y deja la plantilla detrás — quien se registra no está
          navegando a otro sitio, está rellenando algo encima de donde estaba. */}
      <Stack.Screen
        name="registro"
        options={{
          headerShown: false,
          presentation: "formSheet",
          sheetAllowedDetents: [0.85],
          sheetGrabberVisible: true,
        }}
      />

      <Stack.Screen
        name="orden"
        options={{
          headerShown: false,
          presentation: "formSheet",
          sheetAllowedDetents: "fitToContents",
          sheetGrabberVisible: true,
        }}
      />
    </TabStack>
  );
}
