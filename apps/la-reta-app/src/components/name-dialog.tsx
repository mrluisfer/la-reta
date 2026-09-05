import { useState } from "react";
import { Modal, Pressable, TextInput, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { Palette, Radius, Shadow, Spacing, Type } from "@/constants/theme";

/**
 * Poner nombre a algo: un equipo, un invitado.
 *
 * Un modal propio y no `Alert.prompt`: ese solo existe en iOS, y una app que
 * también corre en Android no puede tener una función que desaparece según el
 * teléfono.
 *
 * Cuando el equipo aún se llama "Equipo A", el campo arranca **vacío** y ese
 * nombre queda de marcador de posición. Confiar en `selectTextOnFocus` no
 * bastaba —con `autoFocus`, iOS enfoca antes de aplicar la selección— y lo que
 * salía era "Equipo AJochis FC": el nombre escrito pegado al de fábrica. Con el
 * campo vacío no hay nada que borrar, que además es el caso normal: renombrar
 * es sustituir, no corregir una letra.
 *
 * Quien lo abre lo monta con `key={equipo}`, así que cambiar de equipo lo
 * remonta y el campo trae su nombre sin sincronizar nada: el estado inicial ya
 * es el correcto.
 */
export function NameDialog({
  current,
  placeholder,
  label,
  maxLength,
  onSave,
  onClose,
}: {
  /** El nombre puesto por el usuario; vacío si aún es el de fábrica. */
  current: string;
  placeholder: string;
  /** Antetítulo del campo: dice qué se está nombrando. */
  label: string;
  maxLength: number;
  onSave: (value: string) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState(current);

  function save() {
    onSave(value);
    onClose();
  }

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible>
      <Pressable
        accessibilityLabel="Cerrar"
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: "rgba(9, 9, 11, 0.35)",
          justifyContent: "center",
          padding: Spacing.four,
        }}
      >
        {/* Un toque dentro no debe cerrar: el `Pressable` de fuera es la zona
            de descarte, así que aquí se corta la propagación. */}
        <Pressable onPress={() => undefined}>
          <View
            style={{
              gap: Spacing.three,
              padding: Spacing.four,
              borderRadius: Radius.lg,
              borderCurve: "continuous",
              backgroundColor: Palette.surface,
              boxShadow: Shadow.raised,
            }}
          >
            <Text tone="muted" variant="eyebrow">
              {label}
            </Text>

            <TextInput
              accessibilityLabel={label}
              autoCapitalize="words"
              autoFocus
              maxLength={maxLength}
              onChangeText={setValue}
              onSubmitEditing={save}
              placeholder={placeholder}
              placeholderTextColor={Palette.inkFaint}
              returnKeyType="done"
              selectTextOnFocus
              selectionColor={Palette.accent}
              style={{
                ...Type.body,
                color: Palette.ink,
                height: 52,
                paddingHorizontal: Spacing.three,
                borderRadius: Radius.md,
                borderCurve: "continuous",
                borderWidth: 1,
                borderColor: Palette.line,
              }}
              value={value}
            />

            <View style={{ flexDirection: "row", gap: Spacing.two }}>
              <Button
                flex={1}
                label="Cancelar"
                onPress={onClose}
                size="md"
                variant="ghost"
              />
              <Button flex={1} label="Guardar" onPress={save} size="md" />
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
