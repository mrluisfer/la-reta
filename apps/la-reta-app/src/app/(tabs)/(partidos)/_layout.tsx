import { Stack } from "expo-router";

import { TabStack } from "@/components/tab-stack";

export default function PartidosLayout() {
  return (
    <TabStack>
      <Stack.Screen name="partidos" options={{ title: "Partidos" }} />
      {/* Compartidas entre pestañas; el título lo pone la propia ficha. La de
          jugador también vive aquí: desde el acta de un partido se toca a un
          goleador y su ficha tiene que abrirse **dentro de Partidos**, no
          saltar a otra pestaña. */}
      <Stack.Screen name="partido/[id]" />
      <Stack.Screen name="jugador/[id]" />
    </TabStack>
  );
}
