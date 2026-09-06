import { useAuth } from "@clerk/expo";
import { POSITIONS, type Position } from "@repo/reta/positions";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { isClerkConfigured } from "@/components/auth-provider";
import { Notice } from "@/components/notice";
import { PhotoField } from "@/components/photo-field";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Segmented } from "@/components/ui/segmented";
import { Text } from "@/components/ui/text";
import { MaxContentWidth, Palette, Spacing } from "@/constants/theme";
import { POSITION_LABEL } from "@/lib/players";
import { sendSignup } from "@/lib/signup";
import { personNameError } from "@repo/reta/names";

/**
 * Pedir entrar a la plantilla.
 *
 * Es una **solicitud**, no un alta: al enviarla nadie aparece en la lista
 * todavía. La pantalla lo dice tres veces —en el subtítulo, en el botón y en el
 * acuse— porque es la expectativa que más fácil se rompe: mandas tus datos,
 * vuelves a la plantilla, no te ves y crees que falló.
 *
 * Solo se piden los datos que un admin no puede adivinar: cómo te llamas, cómo
 * te dicen, dónde juegas y cómo localizarte. El overall, la edad o la estatura
 * no van aquí — son los que la reta calibra jugando, y preguntarlos convertiría
 * un trámite de treinta segundos en un formulario de fichaje.
 */
export default function RegistroScreen() {
  const router = useRouter();
  const signedIn = useSignedIn();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [positions, setPositions] = useState<Position[]>([]);
  const [foot, setFoot] = useState<"left" | "right" | "both">("right");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [contact, setContact] = useState("");
  const [note, setNote] = useState("");

  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  // Se avisa al salir del campo y no en cada tecla: marcar en rojo "Lu" cuando
  // alguien va por la mitad de "Luis" es regañar a quien lo está haciendo bien.
  const [touchedName, setTouchedName] = useState(false);
  const [touchedNick, setTouchedNick] = useState(false);

  const nameError = name.length > 0 ? personNameError(name) : null;
  const nickError =
    displayName.length > 0 ? personNameError(displayName) : null;

  const ready =
    personNameError(name) === null &&
    nickError === null &&
    positions.length > 0;

  /**
   * Toca para elegir, vuelve a tocar para quitar.
   *
   * La primera es la principal y la segunda la secundaria — en el orden en que
   * se tocan, que es lo que la cápsula enseña con su número. Con dos ya
   * puestas, una tercera sustituye a la secundaria en vez de no hacer nada: no
   * hacer nada obliga a adivinar por qué el toque se ignoró.
   */
  function togglePosition(value: Position) {
    setPositions((current) => {
      if (current.includes(value)) {
        return current.filter((item) => item !== value);
      }
      if (current.length < 2) return [...current, value];
      return [current[0], value];
    });
  }

  async function submit() {
    setSending(true);
    setError(null);

    try {
      await sendSignup({
        name: name.trim(),
        displayName: displayName.trim() || undefined,
        position: positions[0],
        position2: positions[1],
        preferredFoot: foot,
        contact: contact.trim() || undefined,
        note: note.trim() || undefined,
        photoUrl: photoUrl ?? undefined,
      });
      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No se pudo enviar.");
    } finally {
      setSending(false);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={{
        alignSelf: "center",
        width: "100%",
        maxWidth: MaxContentWidth,
        gap: Spacing.four,
        padding: Spacing.four,
        paddingBottom: insets.bottom + Spacing.five,
      }}
      style={{ backgroundColor: Palette.paper }}
    >
      {sent ? (
        <Sent onClose={() => router.back()} />
      ) : (
        <>
          <View style={{ gap: Spacing.two }}>
            <Text variant="title">Pide tu lugar</Text>
            <Text tone="muted" variant="body">
              Mandas tus datos y alguien de la reta los revisa. No apareces en
              la plantilla hasta que te den el visto bueno.
            </Text>
          </View>

          <Field
            autoCapitalize="words"
            autoCorrect={false}
            error={touchedName ? nameError : null}
            label="Nombre completo"
            onBlur={() => setTouchedName(true)}
            onChangeText={setName}
            placeholder="Luis Fernando Álvarez"
            returnKeyType="next"
            value={name}
          />

          {/* Sin versales forzadas: se escribe como se llama la persona y la
              carta ya lo pinta en mayúsculas cuando toca. Obligarlas aquí
              convertía "Toño" en "TOÑO" en el propio campo, que es donde uno
              está comprobando que lo escribió bien. */}
          <Field
            autoCapitalize="words"
            autoCorrect={false}
            error={touchedNick ? nickError : null}
            label="Cómo te dicen (opcional)"
            maxLength={20}
            onBlur={() => setTouchedNick(true)}
            onChangeText={setDisplayName}
            placeholder="Luisarq"
            returnKeyType="next"
            value={displayName}
          />

          <PhotoField onChange={setPhotoUrl} url={photoUrl} />

          <View style={{ gap: Spacing.two }}>
            <Text tone="muted" variant="eyebrow">
              Dónde juegas
            </Text>
            <Segmented
              onChange={togglePosition}
              options={POSITION_OPTIONS}
              value={positions}
            />
            <Text tone="faint" variant="caption">
              {positions.length === 0
                ? "La primera que elijas es tu posición principal."
                : positions.length === 1
                  ? `${POSITION_LABEL[positions[0]]}. Puedes añadir una segunda.`
                  : `${POSITION_LABEL[positions[0]]} y ${POSITION_LABEL[positions[1]].toLowerCase()}.`}
            </Text>
          </View>

          <View style={{ gap: Spacing.two }}>
            <Text tone="muted" variant="eyebrow">
              Pie
            </Text>
            <Segmented onChange={setFoot} options={FOOT_OPTIONS} value={foot} />
          </View>

          {/* Opcional de verdad: quien manda esto ya entró con su cuenta, así
              que hay por dónde localizarle aunque deje el campo vacío. El
              teclado es el de correo —con su tecla de arroba— porque es lo que
              más se escribe aquí. */}
          <Field
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            inputMode="email"
            keyboardType="email-address"
            label="Contacto (opcional)"
            onChangeText={setContact}
            placeholder="WhatsApp o correo"
            returnKeyType="next"
            textContentType="emailAddress"
            value={contact}
          />

          <Field
            label="Algo que agregar (opcional)"
            multiline
            onChangeText={setNote}
            placeholder="Quién te invitó, cuándo puedes jugar…"
            value={note}
          />

          {/* El fallo va pegado al botón que lo provocó. Arriba del todo
              obligaba a subir el formulario entero para enterarse de por qué no
              se envió, y a bajarlo otra vez para reintentar. */}
          {error === null ? null : (
            <Notice
              actionLabel="Reintentar"
              detail={error}
              onAction={submit}
              title="No pudimos enviar tu solicitud"
            />
          )}

          <Button
            disabled={!ready}
            label="Enviar solicitud"
            loading={sending}
            onPress={submit}
          />

          {/* Entrar sin perder lo escrito, y solo si hace falta: con sesión
              abierta, ofrecer "ya tengo cuenta" es preguntarle a alguien si
              existe.

              `/sign-in` vive en el stack raíz, así que se apila **encima** de
              esta hoja en vez de sustituirla: al cerrar el acceso, este
              formulario sigue montado con todo lo tecleado. Reabrirlo desde
              cero después de escribir seis campos es de las cosas que hacen
              abandonar un alta. */}
          {signedIn ? null : (
            <Button
              icon="person"
              label="Ya tengo cuenta"
              onPress={() => router.push("/sign-in")}
              variant="plain"
            />
          )}
        </>
      )}
    </ScrollView>
  );
}

/**
 * Las quince posiciones, con su nombre en el globo: "CDM" no le dice nada a
 * quien se está registrando, y es justo quien menos jerga conoce.
 */
const POSITION_OPTIONS = POSITIONS.map((value) => ({
  value,
  label: value,
  hint: POSITION_LABEL[value],
}));

/** Las tres que acepta la base; "both" ya existía en el enum. */
const FOOT_OPTIONS = [
  { value: "right" as const, label: "Derecha" },
  { value: "left" as const, label: "Izquierda" },
  { value: "both" as const, label: "Ambas" },
];

/**
 * El acuse.
 *
 * Dice lo que pasa después y no "¡listo!": la solicitud queda en una cola que
 * alguien tiene que mirar, y esa espera es la parte que hay que contar.
 */
function Sent({ onClose }: { onClose: () => void }) {
  return (
    <View style={{ gap: Spacing.four, paddingVertical: Spacing.five }}>
      <View style={{ gap: Spacing.two }}>
        <Text variant="title">Solicitud enviada</Text>
        <Text tone="muted" variant="body">
          La revisa alguien de la reta y te avisa por donde nos dejaste tu
          contacto. Mientras tanto no aparecerás en la plantilla.
        </Text>
      </View>

      <Button label="Listo" onPress={onClose} />
    </View>
  );
}

/**
 * Si hay sesión.
 *
 * Envuelto en su propio hook porque `useAuth` solo existe bajo `ClerkProvider`,
 * y este se monta solo cuando hay llave publicable. Sin llave se responde que
 * no hay sesión, que es la verdad y además el camino que enseña el botón.
 */
function useSignedIn(): boolean {
  const { isSignedIn } = useAuth();
  return isClerkConfigured && isSignedIn === true;
}
