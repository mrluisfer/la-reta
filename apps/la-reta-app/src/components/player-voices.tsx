import { Image } from "expo-image";
import { useState } from "react";
import { Keyboard, Pressable, TextInput, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import { StarPicker, Stars } from "@/components/ui/stars";
import { Surface } from "@/components/ui/surface";
import { Text } from "@/components/ui/text";
import { Palette, Radius, Spacing, Type } from "@/constants/theme";
import { editComment, postComment } from "@/lib/comments";
import { formatMatchDate } from "@/lib/dates";
import { initials } from "@/lib/photos";
import type { PlayerComment } from "@/lib/types";

const AVATAR = 34;
/** El mismo tope que guarda la columna. */
const MAX_BODY = 500;

/**
 * Lo que la reta dice de un jugador, y el sitio para decir lo tuyo.
 *
 * Va al final de la ficha a propósito. Los números de arriba son el jugador;
 * esto es la conversación sobre él, y una conversación se lee después de haber
 * visto de qué va. La nota media sí sube al principio, junto al nombre, porque
 * eso es un dato más de la ficha y no una charla.
 */
export function PlayerVoices({
  playerId,
  comments,
  pending = false,
  canWrite,
  onPosted,
}: {
  playerId: number;
  comments: PlayerComment[] | null;
  pending?: boolean;
  /**
   * Hay sesión y la ficha no es la suya. La regla la aplica el servidor; aquí
   * solo se decide si enseñar el formulario, para no ofrecer algo que va a
   * rebotar.
   */
  canWrite: boolean;
  onPosted: () => void;
}) {
  if (pending) {
    return <Skeleton height={140} />;
  }

  return (
    <View style={{ gap: Spacing.four }}>
      {comments === null || comments.length === 0 ? (
        <Text tone="faint" variant="caption">
          Nadie ha dejado nada escrito todavía.
        </Text>
      ) : (
        <View>
          {comments.map((comment, index) => (
            <CommentRow
              comment={comment}
              key={comment.id}
              last={index === comments.length - 1}
              onSaved={onPosted}
              playerId={playerId}
            />
          ))}
        </View>
      )}

      {canWrite ? (
        <CommentComposer onPosted={onPosted} playerId={playerId} />
      ) : null}
    </View>
  );
}

/**
 * Los dos campos de una reseña: la nota y el texto.
 *
 * Los comparten el formulario de alta y el de edición, que piden exactamente lo
 * mismo. Tenerlos por duplicado significaba que un tope o un color cambiado en
 * uno dejaba al otro atrás.
 */
function ReviewFields({
  rating,
  onRating,
  body,
  onBody,
  placeholder,
}: {
  rating: number;
  onRating: (value: number) => void;
  body: string;
  onBody: (value: string) => void;
  placeholder: string;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <>
      <StarPicker onChange={onRating} value={rating} />

      <TextInput
        accessibilityLabel="Tu comentario"
        maxLength={MAX_BODY}
        multiline
        onBlur={() => setFocused(false)}
        onChangeText={onBody}
        onFocus={() => setFocused(true)}
        placeholder={placeholder}
        placeholderTextColor={Palette.inkFaint}
        selectionColor={Palette.accent}
        style={{
          ...Type.body,
          color: Palette.ink,
          minHeight: 84,
          padding: Spacing.three,
          borderRadius: Radius.md,
          borderCurve: "continuous",
          borderWidth: 1,
          borderColor: focused ? Palette.accent : Palette.line,
          backgroundColor: Palette.surface,
          textAlignVertical: "top",
        }}
        value={body}
      />
    </>
  );
}

/**
 * Escribir una reseña: nota y texto.
 *
 * Las estrellas van primero porque son lo que casi todo el mundo viene a dejar;
 * pedir el texto después hace que quien solo quería puntuar ya haya hecho la
 * mitad.
 *
 * Al publicar **se cierra el teclado**. Esto no es un chat: quien acaba de
 * dejar su reseña ha terminado, y devolverle el cursor al campo vacío tapa con
 * el teclado justo lo que quiere ver —su comentario ya publicado— y sugiere que
 * se espera otro.
 */
function CommentComposer({
  playerId,
  onPosted,
}: {
  playerId: number;
  onPosted: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready = body.trim().length > 0 && !busy;

  async function send() {
    setBusy(true);
    setError(null);
    try {
      await postComment(playerId, { body: body.trim(), rating });
      setBody("");
      setRating(0);
      Keyboard.dismiss();
      onPosted();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "No pudimos publicar tu reseña."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Surface style={{ gap: Spacing.three }}>
      <Text tone="muted" variant="eyebrow">
        Tu reseña
      </Text>

      <ReviewFields
        body={body}
        onBody={setBody}
        onRating={setRating}
        placeholder="¿Cómo juega? ¿Qué tal con él en el equipo?"
        rating={rating}
      />

      {error === null ? null : (
        <Text tone="danger" variant="caption">
          {error}
        </Text>
      )}

      <Button
        disabled={!ready}
        icon="check"
        label={rating === 0 ? "Publicar sin nota" : "Publicar"}
        loading={busy}
        onPress={send}
        size="md"
      />
    </Surface>
  );
}

function CommentRow({
  comment,
  last,
  playerId,
  onSaved,
}: {
  comment: PlayerComment;
  last: boolean;
  playerId: number;
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const author = comment.author ?? "Alguien de la reta";

  return (
    <View
      style={{
        flexDirection: "row",
        gap: Spacing.three,
        paddingVertical: Spacing.three,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: Palette.hairline,
      }}
    >
      {/* La foto de quien escribe, si la tiene. Un comentario con cara pesa
          distinto que uno firmado con un nombre suelto, y aquí la mitad de la
          reta se conoce antes por la cara que por el nombre completo. */}
      <View
        style={{
          width: AVATAR,
          height: AVATAR,
          borderRadius: Radius.pill,
          overflow: "hidden",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: Palette.surfaceSunken,
          borderWidth: 1,
          borderColor: Palette.hairline,
        }}
      >
        {comment.authorImageUrl === null ? (
          <Text tone="muted" variant="caption">
            {initials(author)}
          </Text>
        ) : (
          <Image
            accessibilityIgnoresInvertColors
            alt={author}
            contentFit="cover"
            source={{ uri: comment.authorImageUrl }}
            style={{ width: "100%", height: "100%" }}
            transition={200}
          />
        )}
      </View>

      <View style={{ flex: 1, gap: Spacing.one }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: Spacing.two,
          }}
        >
          <Text numberOfLines={1} style={{ flex: 1 }} variant="bodyStrong">
            {author}
          </Text>

          {comment.rating === null || editing ? null : (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: Spacing.half,
              }}
            >
              <Icon color={Palette.star} name="star-fill" size={13} />
              <Text variant="caption">{comment.rating}</Text>
            </View>
          )}

          {/* Solo en los tuyos, y solo un lápiz. Un comentario con dos botones
              y un menú deja de parecer algo que alguien escribió. */}
          {comment.mine && !editing ? (
            <Pressable
              accessibilityLabel="Editar tu reseña"
              accessibilityRole="button"
              hitSlop={Spacing.two}
              onPress={() => setEditing(true)}
              style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
            >
              <Icon color={Palette.inkFaint} name="pencil" size={15} />
            </Pressable>
          ) : null}
        </View>

        {editing ? (
          <CommentEditor
            comment={comment}
            onClose={() => setEditing(false)}
            onSaved={onSaved}
            playerId={playerId}
          />
        ) : (
          <>
            <Text variant="caption">{comment.body}</Text>
            <Text tone="faint" variant="caption">
              {formatMatchDate(comment.createdAt)}
            </Text>
          </>
        )}
      </View>
    </View>
  );
}

/**
 * Corregir la reseña propia, ahí mismo.
 *
 * En su sitio y no en una hoja aparte: lo que se corrige casi siempre es una
 * palabra o la nota, y sacar eso a otra pantalla cuesta más que el arreglo. El
 * comentario se sustituye por sus dos campos y vuelve a su forma al guardar o
 * al cancelar, así que nunca hay dos versiones del mismo texto a la vista.
 *
 * Se monta al entrar en edición y se desmonta al salir, así que los campos
 * arrancan con lo que hay guardado sin sincronizar nada: no hay estado que
 * quede viejo si el comentario cambia por detrás.
 */
function CommentEditor({
  comment,
  playerId,
  onSaved,
  onClose,
}: {
  comment: PlayerComment;
  playerId: number;
  onSaved: () => void;
  onClose: () => void;
}) {
  const [rating, setRating] = useState(comment.rating ?? 0);
  const [body, setBody] = useState(comment.body);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready = body.trim().length > 0 && !busy;

  async function save() {
    setBusy(true);
    setError(null);

    try {
      await editComment(playerId, comment.id, { body: body.trim(), rating });
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "No pudimos guardar el cambio."
      );
      setBusy(false);
      return;
    }

    // Cerrar desmonta este formulario, así que no queda nada que apagar: el
    // `finally` de siempre habría hecho `setBusy` sobre algo que ya no existe.
    Keyboard.dismiss();
    onSaved();
    onClose();
  }

  return (
    <View style={{ gap: Spacing.three, paddingTop: Spacing.one }}>
      <ReviewFields
        body={body}
        onBody={setBody}
        onRating={setRating}
        placeholder="Tu reseña"
        rating={rating}
      />

      {error === null ? null : (
        <Text tone="danger" variant="caption">
          {error}
        </Text>
      )}

      <View style={{ flexDirection: "row", gap: Spacing.two }}>
        <Button
          flex={1}
          label="Cancelar"
          onPress={onClose}
          size="md"
          variant="ghost"
        />
        <Button
          disabled={!ready}
          flex={1}
          icon="check"
          label="Guardar"
          loading={busy}
          onPress={save}
          size="md"
        />
      </View>
    </View>
  );
}

/** Estrellas de la nota de portada: grandes, para que se lean como un dato. */
const HERO_STAR = 26;

/**
 * La nota media, bajo la carta y sin tarjeta.
 *
 * Antes era una `Surface` entera para una cifra y cinco estrellas: mucho marco
 * para poco cuadro. Y antes de eso, una fila —estrellas, cifra y recuento en
 * renglón— donde las tres cosas competían por el mismo eje y la vista no sabía
 * dónde empezar.
 *
 * Ahora se apila y se centra bajo la carta, que también lo está: **las
 * estrellas arriba y grandes**, porque son lo que se entiende sin leer, y la
 * cifra con su recuento debajo en letra pequeña, para quien quiera el número
 * exacto. Es el orden en que se mira: primero cuántas están encendidas, luego
 * cuánto vale eso y de cuánta gente sale.
 */
export function RatingSummary({
  average,
  votes,
}: {
  average: number | null;
  votes: number;
}) {
  if (average === null || votes === 0) return null;

  return (
    <View style={{ alignItems: "center", gap: Spacing.two }}>
      <Stars gap={4} size={HERO_STAR} value={average} />

      <View
        style={{
          flexDirection: "row",
          alignItems: "baseline",
          gap: Spacing.one,
        }}
      >
        <Text variant="bodyStrong">{average.toFixed(1)}</Text>
        <Text tone="faint" variant="caption">
          {votes === 1 ? "· 1 nota de la reta" : `· ${votes} notas de la reta`}
        </Text>
      </View>
    </View>
  );
}
