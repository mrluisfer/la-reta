import { useRef, useState } from "react";
import { Pressable, TextInput, useWindowDimensions, View } from "react-native";
import Swipeable, {
  SwipeDirection,
  type SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";
import Animated, {
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";

import { NameDialog } from "@/components/name-dialog";
import { Button } from "@/components/ui/button";
import { GlassSurface } from "@/components/ui/glass-surface";
import { Icon, type IconName } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { Palette, Radius, Spacing, Type } from "@/constants/theme";
import { DEFAULT_GUEST_OVERALL } from "@/lib/guests";
import type { Player } from "@/lib/types";

/** Lo que sube o baja cada toque en el nivel de un invitado. */
const STEP = 1;
/**
 * Lado del objetivo táctil, en puntos. Es el mínimo que pide Apple: los
 * botones medían 30 y errar el toque en un ± que está al lado de otro ± es
 * subirle el nivel a quien no era.
 */
const TAP = 44;
const MIN_OVERALL = 1;
const MAX_OVERALL = 99;
/** Mismo tope que un nombre de equipo: cabe en el tablero y en la ficha. */
const MAX_NAME = 24;
/** Ancho de la acción que asoma al deslizar, en puntos. Sin etiqueta debajo, el
 *  icono pide bastante menos sitio y el renglón se abre menos para llegar. */
const ACTION = 72;
/** Cuánto tiñe el fondo de la acción cuando el gesto llega al punto de soltar. */
const TINT_ALPHA = 0.16;
/**
 * Cuánto hay que arrastrar para que la acción se ejecute, en tanto por uno del
 * ancho de la pantalla.
 *
 * Es la diferencia entre un gesto y un menú: un desliz corto se arrepiente solo
 * y vuelve a su sitio; uno decidido —más de un tercio de la pantalla— hace lo
 * que ibas a hacer sin pedir un segundo toque. Un tercio es bastante más que el
 * roce accidental al bajar por la lista y bastante menos que cruzarla entera.
 */
const COMMIT_RATIO = 0.38;

/**
 * Los de última hora: se apuntan con nombre y se les ajusta el nivel a mano.
 *
 * El nivel se edita con dos botones y no escribiendo, porque nadie sabe si el
 * primo de Toño es un 43 o un 46: lo que se hace de verdad es empujar el número
 * arriba o abajo hasta que la reta se ve pareja, y para eso un teclado numérico
 * estorba más de lo que ayuda.
 *
 * "Ataja" es la única posición que se pregunta. Da igual si el invitado juega
 * de medio o de delantero —el repartidor lo acomoda—, pero si puede ponerse al
 * arco cambia el reparto entero.
 *
 * Quitar y renombrar viven en el deslizamiento, en los lados que iOS lleva
 * usando desde Mail: **arrastra a la izquierda** y sale Quitar en rojo,
 * **arrastra a la derecha** y sale Renombrar. Los ± se quedan donde estaban
 * porque ajustar el nivel es lo que se hace a cada rato y esconderlo tras un
 * gesto sería peor. La cruz de quitar sí se fue: repetía lo que ya hace el
 * gesto y le robaba ancho al nombre.
 *
 * Un gesto no lo ve un lector de pantalla, así que las dos acciones se publican
 * también como `accessibilityActions` del renglón — el rotor de VoiceOver las
 * lee sin arrastrar nada.
 */
export function GuestList({
  guests,
  onAdd,
  onRate,
  onRemove,
  onRename,
}: {
  guests: Player[];
  onAdd: (input: { name: string; overall: number; keeper: boolean }) => void;
  onRate: (id: number, overall: number) => void;
  onRemove: (id: number) => void;
  onRename: (id: number, name: string) => void;
}) {
  const [name, setName] = useState("");
  const [keeper, setKeeper] = useState(false);
  const [renaming, setRenaming] = useState<Player | null>(null);

  function add() {
    if (name.trim().length === 0) return;
    onAdd({ name, overall: DEFAULT_GUEST_OVERALL, keeper });
    setName("");
    setKeeper(false);
  }

  return (
    <View style={{ gap: Spacing.three }}>
      <View style={{ flexDirection: "row", gap: Spacing.two }}>
        <TextInput
          accessibilityLabel="Nombre del invitado"
          autoCapitalize="words"
          onChangeText={setName}
          onSubmitEditing={add}
          placeholder="Nombre del invitado"
          placeholderTextColor={Palette.inkFaint}
          returnKeyType="done"
          selectionColor={Palette.accent}
          style={{
            ...Type.body,
            flex: 1,
            color: Palette.ink,
            height: 44,
            paddingHorizontal: Spacing.three,
            borderRadius: Radius.md,
            borderCurve: "continuous",
            borderWidth: 1,
            borderColor: Palette.line,
            backgroundColor: Palette.surface,
          }}
          value={name}
        />

        <Pressable
          accessibilityLabel="El invitado ataja"
          accessibilityRole="switch"
          accessibilityState={{ checked: keeper }}
          onPress={() => setKeeper((previous) => !previous)}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          {/* Cristal, como el resto de controles flotantes de iOS 26. Encendido
              se tiñe de verde: el material solo cambia de fondo, así que sin
              tinte un interruptor puesto y otro quitado se verían igual.
              `GlassSurface` ya cae a una tarjeta con filete donde no hay
              liquid glass, y ahí el tinte hace de fondo. */}
          <GlassSurface
            isInteractive
            style={{
              height: 44,
              paddingHorizontal: Spacing.three,
              borderRadius: Radius.md,
              borderCurve: "continuous",
              overflow: "hidden",
              borderWidth: 1,
              borderColor: keeper ? Palette.accentLine : Palette.hairline,
              alignItems: "center",
              justifyContent: "center",
            }}
            tintColor={keeper ? Palette.accentSoft : undefined}
          >
            <Text tone={keeper ? "accent" : "muted"} variant="eyebrow">
              Ataja
            </Text>
          </GlassSurface>
        </Pressable>
      </View>

      <Button
        disabled={name.trim().length === 0}
        label="Añadir invitado"
        onPress={add}
        size="md"
        variant="glass"
      />

      {guests.length === 0 ? null : (
        <View>
          {guests.map((guest, index) => (
            <GuestRow
              key={guest.id}
              guest={guest}
              last={index === guests.length - 1}
              onRate={onRate}
              onRemove={onRemove}
              onRename={() => setRenaming(guest)}
            />
          ))}
        </View>
      )}

      {renaming === null ? null : (
        <NameDialog
          current={renaming.name}
          key={renaming.id}
          label="Nombre del invitado"
          maxLength={MAX_NAME}
          onClose={() => setRenaming(null)}
          onSave={(value) => onRename(renaming.id, value)}
          placeholder={renaming.displayName}
        />
      )}
    </View>
  );
}

function GuestRow({
  guest,
  last,
  onRate,
  onRemove,
  onRename,
}: {
  guest: Player;
  last: boolean;
  onRate: (id: number, overall: number) => void;
  onRemove: (id: number) => void;
  onRename: () => void;
}) {
  const swipe = useRef<SwipeableMethods>(null);
  const { width } = useWindowDimensions();

  const commit = Math.round(width * COMMIT_RATIO);
  // `progress` viene en múltiplos del ancho de la acción, así que el punto de
  // soltar hay que traducirlo a esa misma escala para teñir con el gesto.
  const commitProgress = commit / ACTION;

  function rename() {
    swipe.current?.close();
    onRename();
  }

  function remove() {
    // Cerrar antes de quitar: si el renglón desaparece abierto, el de debajo
    // sube ya desplazado y parece que se borró el que no era.
    swipe.current?.close();
    onRemove(guest.id);
  }

  return (
    <Swipeable
      // El umbral es lo que convierte esto en un gesto y no en un menú: por
      // debajo, el renglón vuelve solo a su sitio; por encima, la acción se
      // ejecuta al soltar. Nada se queda abierto esperando un segundo toque.
      leftThreshold={commit}
      // `onSwipeableWillOpen` salta al soltar pasado el umbral, no al cruzarlo
      // con el dedo: hasta que no levantas, todavía puedes echarte atrás.
      //
      // Ojo con el nombre: `direction` es hacia dónde fue el **dedo**, no qué
      // lado se abrió. Arrastrar a la derecha descubre las acciones de la
      // izquierda y llega aquí como `RIGHT`. Leerlo al revés hacía que un
      // desliz a la derecha borrara al invitado en vez de renombrarlo.
      onSwipeableWillOpen={(direction) =>
        direction === SwipeDirection.RIGHT ? rename() : remove()
      }
      ref={swipe}
      renderLeftActions={(progress) => (
        <SwipeAction
          commit={commitProgress}
          icon="pencil"
          progress={progress}
          side="left"
          tint={Palette.accent}
          width={width}
        />
      )}
      renderRightActions={(progress) => (
        <SwipeAction
          commit={commitProgress}
          icon="trash"
          progress={progress}
          side="right"
          tint={Palette.danger}
          width={width}
        />
      )}
      rightThreshold={commit}
    >
      <View
        accessibilityActions={[
          { name: "rename", label: `Renombrar a ${guest.displayName}` },
          { name: "delete", label: `Quitar a ${guest.displayName}` },
        ]}
        onAccessibilityAction={(event) => {
          if (event.nativeEvent.actionName === "rename") onRename();
          if (event.nativeEvent.actionName === "delete") onRemove(guest.id);
        }}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: Spacing.two,
          paddingVertical: Spacing.two,
          backgroundColor: Palette.paper,
          borderBottomWidth: last ? 0 : 1,
          borderBottomColor: Palette.hairline,
        }}
      >
        <View style={{ flex: 1, gap: Spacing.half }}>
          <Text numberOfLines={1} variant="bodyStrong">
            {guest.displayName}
          </Text>
          <Text tone="faint" variant="caption">
            {guest.position === "GK" ? "Invitado · ataja" : "Invitado"}
          </Text>
        </View>

        <Step
          disabled={guest.overall <= MIN_OVERALL}
          label={`Bajar el nivel de ${guest.displayName}`}
          onPress={() => onRate(guest.id, guest.overall - STEP)}
          symbol="−"
        />

        <Text
          style={{ width: 30, textAlign: "center" }}
          tone="accent"
          variant="statSmall"
        >
          {guest.overall}
        </Text>

        <Step
          disabled={guest.overall >= MAX_OVERALL}
          label={`Subir el nivel de ${guest.displayName}`}
          onPress={() => onRate(guest.id, guest.overall + STEP)}
          symbol="+"
        />
      </View>
    </Swipeable>
  );
}

/**
 * Lo que asoma al arrastrar el renglón.
 *
 * No se puede tocar, y es a propósito: el renglón nunca se queda abierto, así
 * que esto no es un botón sino el aviso de qué va a pasar cuando sueltes. Quien
 * usa lector de pantalla llega por las `accessibilityActions` del renglón, que
 * no dependen de arrastrar nada.
 *
 * Solo el icono: la papelera y el lápiz se leen antes que cualquier palabra.
 *
 * El fondo se tiñe del color de la acción **a medida que te acercas al punto de
 * soltar**, y llega a su tono pleno justo ahí. Sin texto, el color es lo único
 * que dice cuál de las dos vas a ejecutar, y que suba con el gesto convierte el
 * umbral en algo que se ve en vez de adivinarse. Va en una capa aparte con su
 * opacidad animada y no en un color con alfa, para que el icono se quede a
 * color pleno encima.
 *
 * Esa capa mide el ancho de la pantalla y no los 72 pt del icono, anclada al
 * borde por el que entra la acción. El icono tiene que medir lo que mide para
 * que el renglón sepa dónde pararse, pero el gesto lo arrastra bastante más
 * lejos que eso, y con el color pegado al icono el resto del hueco quedaba en
 * blanco. `Swipeable` recorta sus acciones al renglón y el contenido tiene
 * fondo propio, así que la losa solo se ve por donde el renglón ya se apartó.
 */
function SwipeAction({
  icon,
  tint,
  progress,
  commit,
  side,
  width,
}: {
  icon: IconName;
  tint: string;
  progress: SharedValue<number>;
  /** Valor de `progress` en el que la acción se ejecutaría al soltar. */
  commit: number;
  /** Borde por el que entra la acción: hacia ahí se ancla el color. */
  side: "left" | "right";
  /** Ancho de la pantalla: lo que llega a destaparse como mucho. */
  width: number;
}) {
  const tintStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, commit], [0, TINT_ALPHA], "clamp"),
  }));

  return (
    <View
      style={{
        width: ACTION,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Animated.View
        style={[
          {
            position: "absolute",
            top: 0,
            bottom: 0,
            width,
            backgroundColor: tint,
          },
          side === "left" ? { left: 0 } : { right: 0 },
          tintStyle,
        ]}
      />
      <Icon color={tint} name={icon} size={22} />
    </View>
  );
}

function Step({
  symbol,
  label,
  disabled,
  onPress,
}: {
  symbol: string;
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({ opacity: disabled ? 0.3 : pressed ? 0.5 : 1 })}
    >
      <View
        style={{
          width: TAP,
          height: TAP,
          borderRadius: Radius.pill,
          borderWidth: 1,
          borderColor: Palette.line,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text tone="muted" variant="bodyStrong">
          {symbol}
        </Text>
      </View>
    </Pressable>
  );
}
