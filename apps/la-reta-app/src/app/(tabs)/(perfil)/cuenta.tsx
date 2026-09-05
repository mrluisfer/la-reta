import { useAuth, useUser } from "@clerk/expo";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { Row } from "@/components/ui/row";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { MaxContentWidth, Palette, Radius, Spacing } from "@/constants/theme";
import { initials } from "@/lib/photos";

/**
 * Tu cuenta.
 *
 * Es la hoja que abre la tarjeta del perfil. Aquí vive todo lo que se puede
 * hacer con una cuenta, y no solo cerrar sesión: así lo que venga después
 * —cambiar la foto, el correo, las notificaciones— tiene dónde caer sin volver
 * a rediseñar el perfil.
 *
 * **Casi nada de esto funciona todavía**, y la pantalla lo dice en vez de
 * fingirlo: las filas sin implementar salen apagadas y con su "Pronto". Un
 * botón que no hace nada al tocarlo se lee como una app rota; uno que avisa de
 * que aún no está se lee como una app que va a crecer.
 *
 * Cerrar sesión sí funciona. Borrar la cuenta pide confirmación aunque hoy no
 * borre nada: cuando lo haga, el diálogo ya estará probado y en su sitio, que
 * es el orden correcto para una acción que no se puede deshacer.
 */
export default function CuentaScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();
  const { user } = useUser();

  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const displayName =
    user?.fullName ?? user?.firstName ?? user?.username ?? "Tu cuenta";
  const email = user?.primaryEmailAddress?.emailAddress ?? "";

  async function leave() {
    // Se cierra la hoja antes de cerrar sesión: si no, el perfil de debajo se
    // vacía mientras la hoja sigue encima enseñando tu nombre.
    router.back();
    await signOut();
  }

  return (
    <ScrollView
      contentContainerStyle={{
        alignSelf: "center",
        width: "100%",
        maxWidth: MaxContentWidth,
        gap: Spacing.five,
        padding: Spacing.four,
        paddingBottom: insets.bottom + Spacing.five,
      }}
      style={{ backgroundColor: Palette.paper }}
    >
      <View style={{ alignItems: "center", gap: Spacing.three }}>
        <View
          style={{
            width: 84,
            height: 84,
            borderRadius: Radius.pill,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: Palette.line,
            backgroundColor: Palette.accentSoft,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {user?.imageUrl ? (
            <Image
              accessibilityIgnoresInvertColors
              alt={displayName}
              contentFit="cover"
              source={user.imageUrl}
              style={{ width: "100%", height: "100%" }}
              transition={180}
            />
          ) : (
            <Text style={{ color: Palette.accent }} variant="stat">
              {initials(displayName)}
            </Text>
          )}
        </View>

        <View style={{ alignItems: "center", gap: Spacing.half }}>
          <Text variant="title">{displayName}</Text>
          {email ? (
            <Text selectable tone="muted" variant="caption">
              {email}
            </Text>
          ) : null}
        </View>
      </View>

      <Section title="Tu cuenta">
        <View>
          <Row detail="Pronto" icon="person" title="Nombre y foto" />
          <Row detail="Pronto" icon="jersey" title="Tu ficha en la reta" />
          <Row detail="Pronto" icon="spark" last title="Notificaciones" />
        </View>
      </Section>

      <Section title="Sesión">
        <View>
          <Row icon="arrow" onPress={leave} title="Cerrar sesión" />
          <Row
            detail="Se borra tu cuenta y lo que hayas escrito"
            icon="trash"
            last
            onPress={() => setConfirmingDelete(true)}
            title="Eliminar cuenta"
          />
        </View>
      </Section>

      {confirmingDelete ? (
        <ConfirmDialog
          confirmLabel="Eliminar"
          detail="Todavía no está conectado: por ahora esto no borra nada."
          onClose={() => setConfirmingDelete(false)}
          onConfirm={() => undefined}
          title="¿Eliminar tu cuenta?"
        />
      ) : null}
    </ScrollView>
  );
}
