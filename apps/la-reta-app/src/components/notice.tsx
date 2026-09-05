import { View } from "react-native";

import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { Text } from "@/components/ui/text";
import { Palette, Spacing } from "@/constants/theme";

export type NoticeProps = {
  title: string;
  detail?: string;
  actionLabel?: string;
  onAction?: () => void;
};

/**
 * Aviso de un fallo que el usuario puede resolver. Cuenta qué pasó y ofrece la
 * salida en el mismo bloque; un error sin acción solo es una queja.
 */
export function Notice({ title, detail, actionLabel, onAction }: NoticeProps) {
  return (
    <Surface
      style={{ flexDirection: "row", gap: Spacing.three, alignItems: "center" }}
    >
      <View
        style={{
          width: 3,
          alignSelf: "stretch",
          borderRadius: 2,
          backgroundColor: Palette.danger,
        }}
      />

      <View style={{ flex: 1, gap: Spacing.half }}>
        <Text variant="bodyStrong">{title}</Text>
        {detail ? (
          <Text selectable tone="muted" variant="caption">
            {detail}
          </Text>
        ) : null}
      </View>

      {actionLabel && onAction ? (
        <Button
          icon="refresh"
          label={actionLabel}
          onPress={onAction}
          size="md"
          variant="plain"
        />
      ) : null}
    </Surface>
  );
}
