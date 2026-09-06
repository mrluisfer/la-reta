import { useUser } from "@clerk/expo";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { Fragment } from "react";
import { Pressable, View } from "react-native";

import { useTabActionValue, type TabAction } from "@/components/tab-action";
import { isClerkConfigured } from "@/components/auth-provider";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { Palette, Spacing } from "@/constants/theme";
import { API_URL } from "@/lib/api";

/**
 * Barra de pestañas nativa. En iOS 26 se dibuja con liquid glass.
 *
 * Cinco destinos, con la acción de armar en el centro: es la posición que
 * Instagram consolidó para la acción que crea algo, y aquí crear es exactamente
 * eso —montar la reta. Cinco es también el máximo que Material permite en
 * Android, así que la lista está llena y cualquier destino nuevo tendrá que
 * colgar de uno de estos, no sumar una sexta pestaña.
 *
 * No se le pasa `backgroundColor` a propósito: un color opaco sustituye al
 * material y el cristal desaparece.
 *
 * El accesorio de abajo lleva la acción principal de la pantalla que esté
 * abierta —el hueco que en Mail ocupa el botón de redactar—. Se encoge y crece
 * con la barra, así que la acción siempre está donde el pulgar ya estaba.
 */
/** Lado del retrato en la barra, en puntos. Sin esta pista, iOS dibuja la
 *  imagen a su tamaño natural y se come la fila entera. */
const AVATAR_PT = 28;

export default function AppTabs() {
  const actions = useTabActionValue();
  const avatar = useAvatarIcon();

  return (
    <NativeTabs
      iconColor={Palette.inkMuted}
      // Minimiza la barra al bajar y la devuelve al subir: el gesto que
      // acompaña al liquid glass en iOS 26.
      minimizeBehavior="onScrollDown"
      tintColor={Palette.accent}
    >
      {/* El accesorio se monta solo cuando hay algo que ofrecer. Dejándolo
          siempre, las pantallas sin acción enseñaban una píldora blanca vacía
          flotando sobre la barra: ocupaba sitio y no hacía nada. */}
      {actions.length > 0 ? (
        <NativeTabs.BottomAccessory>
          <ScreenActions actions={actions} />
        </NativeTabs.BottomAccessory>
      ) : null}

      <NativeTabs.Trigger name="(inicio)">
        <NativeTabs.Trigger.Label>Inicio</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          md="home"
          sf={{ default: "house", selected: "house.fill" }}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="(plantilla)">
        <NativeTabs.Trigger.Label>Plantilla</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          md="group"
          sf={{ default: "person.2", selected: "person.2.fill" }}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="(reta)">
        <NativeTabs.Trigger.Label>Armar</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          md="add_circle"
          sf={{ default: "plus.circle", selected: "plus.circle.fill" }}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="(partidos)">
        <NativeTabs.Trigger.Label>Partidos</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          md="emoji_events"
          sf={{ default: "trophy", selected: "trophy.fill" }}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="(perfil)">
        <NativeTabs.Trigger.Label>Perfil</NativeTabs.Trigger.Label>
        {/* Con sesión, tu cara en lugar del monigote. `renderingMode="original"`
            es obligatorio: por defecto iOS trata el icono de una pestaña como
            plantilla y lo pinta de un solo color, así que la foto saldría como
            una silueta verde. */}
        {avatar === null ? (
          <NativeTabs.Trigger.Icon
            md="account_circle"
            sf={{
              default: "person.crop.circle",
              selected: "person.crop.circle.fill",
            }}
          />
        ) : (
          <NativeTabs.Trigger.Icon
            renderingMode="original"
            src={{ uri: avatar, width: AVATAR_PT, height: AVATAR_PT }}
          />
        )}
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

/**
 * El botón de la pantalla activa, en cristal.
 *
 * La acción llega por props y no del store: iOS monta dos copias de esto, una
 * por colocación, y la documentación de Expo avisa de que el estado interno no
 * se comparte entre ellas. Leyéndola arriba, las dos dibujan lo mismo.
 *
 * Cada acción mide lo que ocupa su contenido y el grupo va centrado, en vez de
 * repartirse el accesorio a partes iguales. Con dos acciones, repartir daba a
 * "Compartir" media píldora de zona pulsable vacía a cada lado del texto, y el
 * filete que las separa caía lejísimos de ambas etiquetas.
 *
 * El ancho de la píldora **no** se decide aquí: el accesorio lo dimensiona
 * UIKit —todo el ancho de la barra desplegada, el sobrante cuando se encoge— y
 * react-native-screens nos pasa ese marco ya hecho. Así que con una sola acción
 * el cristal se seguirá viendo largo alrededor del botón; lo que se ajusta es
 * el botón, no el vidrio.
 *
 * No dibuja cristal propio: el accesorio **ya es** una píldora de cristal, así
 * que meterle otra dentro con su relleno alrededor se veía como dos botones,
 * uno encajado en el otro. Aquí solo va el contenido —icono y etiqueta—.
 *
 * El acento se queda en el icono y el texto, no en el fondo. Este accesorio
 * aparece y desaparece al cambiar de pestaña, y una losa verde entrando de
 * golpe se leía como un parpadeo; en el material de la barra, la transición se
 * lee como que el cristal se alarga.
 *
 * La etiqueta se queda también con la barra encogida. Mail ahí deja solo el
 * icono, pero Mail tiene una píldora ajustada a su contenido; aquí el cristal
 * mide lo que UIKit quiera y un icono suelto en medio de tanto vidrio parecía
 * un botón sin terminar. Con el nombre al lado, el mismo hueco se lee como un
 * botón ancho y no como un error.
 *
 * Al encoger, la etiqueta baja a `caption` y el hueco se cierra: son los dos
 * puntos donde se gana sitio sin tocar el icono, que es lo que se reconoce de
 * lejos. Si aun así no cupiera —"Repartir otra vez" junto a "Compartir" en una
 * pantalla estrecha—, el texto se corta con puntos suspensivos en vez de
 * empujar al vecino fuera del cristal.
 */
function ScreenActions({ actions }: { actions: TabAction[] }) {
  // Desplegado el accesorio ocupa el ancho de la pantalla; encogido comparte
  // fila con la tab bar y queda bastante menos sitio. Lo que cambia es cuánto
  // aire se le da a cada acción, no lo que enseña.
  const compact = NativeTabs.BottomAccessory.usePlacement() === "inline";

  return (
    <View
      style={{
        flex: 1,
        flexDirection: "row",
        alignItems: "stretch",
        justifyContent: "center",
      }}
    >
      {actions.map((action, index) => (
        <Fragment key={action.label}>
          {index === 0 ? null : (
            // Un filete y no un hueco: dos botones separados dentro de una
            // misma píldora se leerían otra vez como dos píldoras.
            <View
              style={{
                width: 1,
                marginVertical: Spacing.two,
                backgroundColor: Palette.hairline,
              }}
            />
          )}
          <ScreenAction action={action} compact={compact} />
        </Fragment>
      ))}
    </View>
  );
}

function ScreenAction({
  action,
  compact,
}: {
  action: TabAction;
  compact: boolean;
}) {
  return (
    <Pressable
      accessibilityLabel={action.label}
      accessibilityRole="button"
      accessibilityState={{ disabled: action.disabled ?? false }}
      disabled={action.disabled}
      onPress={action.onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        // Encoge, no crece: el botón mide su contenido, y si dos etiquetas
        // largas no cupieran, ceden en vez de desbordar el cristal.
        flexShrink: 1,
        gap: compact ? Spacing.one : Spacing.two,
        // El relleno es la zona pulsable. Sin él, el objetivo sería el ancho
        // exacto del icono —24 pt— y fallar el toque en una barra flotante es
        // de las cosas que peor sientan.
        paddingHorizontal: compact ? Spacing.two : Spacing.three,
        opacity: action.disabled ? 0.4 : pressed ? 0.6 : 1,
      })}
    >
      <Icon
        color={Palette.accent}
        name={action.icon}
        size={18}
        strokeWidth={2}
      />
      <Text
        numberOfLines={1}
        style={{ flexShrink: 1 }}
        tone="accent"
        variant={compact ? "caption" : "bodyStrong"}
      >
        {action.label}
      </Text>
    </Pressable>
  );
}

/**
 * La foto de la cuenta para la pestaña de perfil, o `null` si no hay.
 *
 * No apunta directo a Clerk sino a nuestro `/api/v1/avatar`, que la devuelve
 * recortada en círculo. La barra de iOS dibuja la imagen tal cual —no la
 * redondea ni la recorta—, así que una foto cuadrada se vería cuadrada entre
 * iconos redondos, y enmascararla en el teléfono pediría otra librería nativa.
 *
 * Va en un hook aparte porque `useUser` solo existe bajo `ClerkProvider`, que
 * se monta únicamente si hay llave publicable.
 */
function useAvatarIcon(): string | null {
  const { user } = useUser();

  if (!(isClerkConfigured && user?.imageUrl)) {
    return null;
  }
  return `${API_URL}/api/v1/avatar?u=${encodeURIComponent(user.imageUrl)}`;
}
