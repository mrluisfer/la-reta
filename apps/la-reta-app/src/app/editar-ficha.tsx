import { POSITIONS, type Position } from "@repo/reta/positions";
import { personNameError } from "@repo/reta/names";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Notice } from "@/components/notice";
import { PhotoField } from "@/components/photo-field";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Segmented } from "@/components/ui/segmented";
import { Text } from "@/components/ui/text";
import { MaxContentWidth, Palette, Spacing } from "@/constants/theme";
import {
  ageFromBirthDate,
  birthDateFromIso,
  birthDateToIso,
  maskBirthDate,
} from "@/lib/dates";
import { useReta } from "@/hooks/use-reta";
import { POSITION_LABEL } from "@/lib/players";
import { savePlayerInfo } from "@/lib/signup";
import type { Player } from "@/lib/types";

/**
 * Editar tu propia ficha.
 *
 * Solo la información: cómo te llamas, dónde juegas, tu pie y tu físico. **Los
 * seis atributos no están**, y no por descuido — los mueve la reta jugando, y
 * el servidor los relee de la fila aunque el cliente los mande. Ofrecerlos aquí
 * sería prometer algo que la API no va a hacer.
 *
 * Vive en la raíz y no dentro de una pestaña porque la ficha se abre desde
 * Inicio, Plantilla y Buscar: colgada de una sola pila, volver de editar
 * devolvería a la pestaña equivocada.
 *
 * Los campos arrancan con lo que ya hay, así que se toca un dato y se guarda;
 * quien entra a cambiar la estatura no tiene que reescribir su nombre.
 */
export default function EditarFichaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { players, pending, refetch } = useReta();

  const player = players?.find((item) => String(item.id) === id) ?? null;

  // El formulario se monta **solo cuando hay ficha**, y no antes con valores
  // vacíos: los campos arrancan de su estado inicial una única vez, así que
  // montarlo con el roster todavía en el aire dejaba una hoja en blanco que ya
  // no se rellenaba cuando llegaban los datos.
  if (player === null) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: Palette.paper,
          alignItems: "center",
          justifyContent: "center",
          gap: Spacing.three,
          padding: Spacing.four,
        }}
      >
        {pending ? (
          <ActivityIndicator color={Palette.accent} />
        ) : (
          <Text tone="faint" variant="caption">
            No encontramos esta ficha.
          </Text>
        )}
      </View>
    );
  }

  return <EditForm key={player.id} onSaved={refetch} player={player} />;
}

function EditForm({
  player,
  onSaved,
}: {
  player: Player;
  onSaved: () => void;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState(player.name);
  const [displayName, setDisplayName] = useState(player.displayName);
  const [positions, setPositions] = useState<Position[]>(
    [player.position, player.position2].filter(Boolean) as Position[]
  );
  const [foot, setFoot] = useState(player.preferredFoot);
  const [photoUrl, setPhotoUrl] = useState<string | null>(player.photoUrl);
  const [height, setHeight] = useState(String(player.heightCm));
  const [weight, setWeight] = useState(String(player.weightKg));
  const [birth, setBirth] = useState(birthDateFromIso(player.birthDate));

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touchedName, setTouchedName] = useState(false);

  const nameError = name.length > 0 ? personNameError(name) : null;

  // Vacío es válido: hay fichas viejas que solo tienen la edad y a nadie hay que
  // obligarlo a recordar el día exacto para cambiarse la estatura.
  const birthIso = birthDateToIso(birth);
  const birthAge = ageFromBirthDate(birthIso);
  const birthError =
    birth.length > 0 && birthAge === null
      ? "Escribe la fecha como 12/03/1990."
      : null;

  const ready =
    personNameError(name) === null &&
    positions.length > 0 &&
    birthError === null &&
    !saving;

  function togglePosition(value: Position) {
    setPositions((current) => {
      if (current.includes(value)) {
        return current.filter((item) => item !== value);
      }
      if (current.length < 2) return [...current, value];
      return [current[0], value];
    });
  }

  async function save() {
    setSaving(true);
    setError(null);

    try {
      await savePlayerInfo(player.id, {
        name: name.trim(),
        displayName: displayName.trim(),
        position: positions[0],
        position2: positions[1] ?? "",
        preferredFoot: foot,
        nationality: player.nationality,
        photoUrl: photoUrl ?? "",
        // Se manda la fecha, no los años. El servidor deriva la edad de ella
        // cuando la hay, así que teclear "31" y dejar la fecha quieta no habría
        // cambiado nada; y mandarla vacía teniéndola habría borrado el dato.
        birthDate: birthIso ?? "",
        age: birthAge ?? player.age,
        heightCm: Number(height) || player.heightCm,
        weightKg: Number(weight) || player.weightKg,
      });
      onSaved();
      router.back();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  // `ScrollView` a secas, sin `KeyboardAvoidingView`: dentro de una hoja el
  // envoltorio se queda sin alto y la deja en blanco. Es la misma estructura
  // que la hoja de registro, que sí se ve.
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
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ gap: Spacing.two }}>
        <Text variant="title">Tu ficha</Text>
        <Text tone="muted" variant="body">
          Cambia tus datos cuando quieras. Los atributos no se tocan aquí: esos
          los mueve la reta.
        </Text>
      </View>

      <PhotoField onChange={setPhotoUrl} url={photoUrl} />

      <Field
        autoCapitalize="words"
        autoCorrect={false}
        error={touchedName ? nameError : null}
        label="Nombre completo"
        onBlur={() => setTouchedName(true)}
        onChangeText={setName}
        returnKeyType="next"
        value={name}
      />

      <Field
        autoCapitalize="words"
        autoCorrect={false}
        label="Cómo te dicen"
        maxLength={20}
        onChangeText={setDisplayName}
        returnKeyType="next"
        value={displayName}
      />

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
            ? "Elige al menos una."
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

      <View style={{ gap: Spacing.two }}>
        <Field
          error={birthError}
          inputMode="numeric"
          keyboardType="number-pad"
          label="Fecha de nacimiento"
          maxLength={10}
          onChangeText={(text) => setBirth(maskBirthDate(text))}
          placeholder="DD/MM/AAAA"
          value={birth}
        />
        {birthError === null ? (
          <Text tone="faint" variant="caption">
            {birthAge === null
              ? "De aquí sale la edad que enseña tu ficha."
              : `${birthAge} años. Tu ficha los suma sola cada cumpleaños.`}
          </Text>
        ) : null}
      </View>

      {/* Alineados por abajo: si una etiqueta ocupa dos renglones los dos
          recuadros siguen empezando a la misma altura. */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          gap: Spacing.three,
        }}
      >
        <View style={{ flex: 1 }}>
          <Field
            inputMode="numeric"
            keyboardType="number-pad"
            label="Estatura (cm)"
            maxLength={3}
            onChangeText={setHeight}
            value={height}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Field
            inputMode="numeric"
            keyboardType="number-pad"
            label="Peso (kg)"
            maxLength={3}
            onChangeText={setWeight}
            value={weight}
          />
        </View>
      </View>

      {error === null ? null : (
        <Notice
          actionLabel="Reintentar"
          detail={error}
          onAction={save}
          title="No pudimos guardar"
        />
      )}

      <Button
        disabled={!ready}
        label="Guardar cambios"
        loading={saving}
        onPress={save}
      />

      <Button label="Cancelar" onPress={() => router.back()} variant="plain" />
    </ScrollView>
  );
}

const POSITION_OPTIONS = POSITIONS.map((value) => ({
  value,
  label: value,
  hint: POSITION_LABEL[value],
}));

const FOOT_OPTIONS = [
  { value: "right" as const, label: "Derecha" },
  { value: "left" as const, label: "Izquierda" },
  { value: "both" as const, label: "Ambas" },
];
