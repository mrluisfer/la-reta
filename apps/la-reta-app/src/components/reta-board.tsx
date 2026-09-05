import type { BalancedTeams, TeamSplit } from "@repo/reta/balancer";
import { defaultTeamName, type TeamKey } from "@repo/reta/teams";
import { useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";

import { PitchLineup } from "@/components/pitch-lineup";
import { NameDialog } from "@/components/name-dialog";
import { MAX_TEAM_NAME } from "@/lib/team-names";
import { Text } from "@/components/ui/text";
import { Display, Palette, Radius, Spacing } from "@/constants/theme";
import { teamSlots } from "@/lib/lineup";
import { teamColor } from "@/lib/teams";
import type { Player } from "@/lib/types";

const PITCH_HEIGHT = 430;

/**
 * La reta ya armada, sobre la cancha.
 *
 * Una reta no se lee como una tabla: se lee como un dibujo. Enseñarla en listas
 * obligaba a traducir "CDM RAMI" a una idea de dónde va a estar ese señor el
 * jueves; sobre el césped esa traducción no hace falta, y además es lo que la
 * gente quiere mandar al grupo.
 *
 * Un equipo por página y se pasan deslizando, en vez de apilar tres canchas: a
 * tamaño de teléfono, tres canchas seguidas son tres pantallas de scroll y
 * ninguna se ve entera. Las fichas de arriba hacen de índice y de atajo — el
 * color es el mismo que el filete de su cancha.
 *
 * El reparto no dibuja una formación fija: las líneas salen de los puestos que
 * el repartidor asignó, así que una reta de siete se ve como una reta de siete
 * y no como un 4-3-3 con cuatro huecos.
 *
 * Los botones no están aquí: viven en la barra fija de la pantalla, para que
 * compartir no dependa de haber llegado al final del scroll.
 */
export function RetaBoard({
  result,
  nameOf,
  onRename,
}: {
  result: BalancedTeams<Player>;
  nameOf: (key: TeamKey) => string;
  onRename: (key: TeamKey, value: string) => void;
}) {
  const pager = useRef<ScrollView>(null);
  const [width, setWidth] = useState(0);
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<TeamKey | null>(null);

  const total = result.teams.reduce(
    (sum, team) => sum + team.lineups.length,
    0
  );

  function measure(event: LayoutChangeEvent) {
    setWidth(event.nativeEvent.layout.width);
  }

  function trackPage(event: NativeSyntheticEvent<NativeScrollEvent>) {
    if (width === 0) return;
    setPage(Math.round(event.nativeEvent.contentOffset.x / width));
  }

  function goTo(index: number) {
    pager.current?.scrollTo({ x: index * width, animated: true });
    setPage(index);
  }

  return (
    <View style={{ gap: Spacing.three }}>
      <Summary diff={result.diff} players={total} teams={result.teams.length} />

      <ScrollView
        contentContainerStyle={{ gap: Spacing.two }}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {result.teams.map((team, index) => (
          <TeamChip
            active={index === page}
            key={team.key}
            name={nameOf(team.key)}
            onPress={() => goTo(index)}
            team={team}
          />
        ))}
      </ScrollView>

      <View onLayout={measure}>
        {width === 0 ? (
          <View style={{ height: PITCH_HEIGHT }} />
        ) : (
          <ScrollView
            horizontal
            onMomentumScrollEnd={trackPage}
            pagingEnabled
            ref={pager}
            showsHorizontalScrollIndicator={false}
          >
            {result.teams.map((team) => (
              <View key={team.key} style={{ width }}>
                <PitchLineup
                  height={PITCH_HEIGHT}
                  overlay={
                    <PitchHeader
                      name={nameOf(team.key)}
                      onRename={() => setEditing(team.key)}
                      team={team}
                    />
                  }
                  slots={teamSlots(team.lineups)}
                />
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {editing ? (
        <NameDialog
          current={
            nameOf(editing) === defaultTeamName(editing) ? "" : nameOf(editing)
          }
          key={editing}
          label="Nombre del equipo"
          maxLength={MAX_TEAM_NAME}
          onClose={() => setEditing(null)}
          onSave={(value) => onRename(editing, value)}
          placeholder={defaultTeamName(editing)}
        />
      ) : null}
    </View>
  );
}

/**
 * Las cifras del reparto, en la tira de la app.
 *
 * Antes eran dos renglones de versalitas grises en las esquinas: se leían como
 * un pie de foto y había que descifrar "0.1 de diferencia" palabra por palabra.
 * En Oswald y con la etiqueta debajo, las tres cifras se comparan de un vistazo
 * —es el mismo patrón que la portada— y el dato que de verdad juzga el reparto,
 * la diferencia, deja de ir escondido a la derecha.
 */
function Summary({
  teams,
  players,
  diff,
}: {
  teams: number;
  players: number;
  diff: number;
}) {
  const cells = [
    { value: String(teams), label: "Equipos" },
    { value: String(players), label: "Jugadores" },
    { value: diff.toFixed(1), label: "Diferencia" },
  ];

  return (
    <View
      style={{
        flexDirection: "row",
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: Palette.hairline,
        paddingVertical: Spacing.three,
      }}
    >
      {cells.map((cell, index) => (
        <View
          key={cell.label}
          style={{
            flex: 1,
            alignItems: "center",
            gap: Spacing.half,
            borderLeftWidth: index === 0 ? 0 : 1,
            borderLeftColor: Palette.hairline,
          }}
        >
          <Text variant="stat">{cell.value}</Text>
          <Text tone="faint" variant="eyebrow">
            {cell.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

/**
 * El rótulo sobre el césped: de quién es esta cancha y qué tiene.
 *
 * Va dentro del dibujo para que sobreviva a la captura de pantalla —la ficha de
 * arriba se queda fuera del recorte— y trae de una vez lo que se pregunta al
 * ver un equipo: el nivel, cuántos son y quién es el mejor que le tocó.
 */
function PitchHeader({
  team,
  name,
  onRename,
}: {
  team: TeamSplit<Player>;
  name: string;
  onRename: () => void;
}) {
  // Solo el nivel y cuántos son. Quién es el mejor ya lo dice la cancha: su
  // cara está ahí, y ponerlo por escrito repetía lo que se ve.
  const detail = `${team.rating} OVR · ${team.lineups.length} jugadores`;

  return (
    <View style={{ alignItems: "center", gap: 2 }}>
      {/* El nombre es el sitio para renombrar: es lo que se quiere cambiar, y
          un lápiz al lado sería un icono más pidiendo que lo descifren. */}
      <Pressable
        accessibilityHint="Cambia el nombre del equipo"
        accessibilityLabel={name}
        accessibilityRole="button"
        hitSlop={Spacing.three}
        onPress={onRename}
        style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
      >
        <Text
          numberOfLines={1}
          style={{
            color: "#FFFFFF",
            fontFamily: Display.bold,
            fontSize: 15,
            lineHeight: 20,
            letterSpacing: 1.6,
            textTransform: "uppercase",
            textShadowColor: "rgba(0, 0, 0, 0.55)",
            textShadowRadius: 4,
          }}
        >
          {name}
        </Text>
      </Pressable>
      <Text
        numberOfLines={1}
        style={{
          color: "rgba(255, 255, 255, 0.85)",
          fontSize: 11,
          lineHeight: 15,
          fontWeight: "600",
          letterSpacing: 0.4,
          textShadowColor: "rgba(0, 0, 0, 0.55)",
          textShadowRadius: 4,
        }}
      >
        {detail}
      </Text>
    </View>
  );
}

/** Índice del carrusel: color del equipo, su letra y su nivel. */
function TeamChip({
  team,
  name,
  active,
  onPress,
}: {
  team: TeamSplit<Player>;
  name: string;
  active: boolean;
  onPress: () => void;
}) {
  const color = teamColor(team.key);

  return (
    <Pressable
      accessibilityLabel={`Ver ${name}`}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: Spacing.two,
          paddingVertical: Spacing.two,
          paddingHorizontal: Spacing.three,
          borderRadius: Radius.pill,
          borderWidth: 1,
          borderColor: active ? color : Palette.line,
          backgroundColor: Palette.surface,
          opacity: active ? 1 : 0.6,
        }}
      >
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: Radius.pill,
            backgroundColor: color,
          }}
        />
        <Text
          numberOfLines={1}
          tone={active ? "ink" : "muted"}
          variant="eyebrow"
        >
          {name}
        </Text>
        <Text tone="faint" variant="eyebrow">
          {team.rating}
        </Text>
      </View>
    </Pressable>
  );
}

/**
 * El reparto en texto plano, listo para pegar en el grupo.
 *
 * Sin tabulaciones ni cajas: WhatsApp usa fuente proporcional y cualquier
 * intento de alinear columnas con espacios se ve torcido en el teléfono de al
 * lado.
 */
export function retaAsMessage(
  result: BalancedTeams<Player>,
  nameOf: (key: TeamKey) => string
): string {
  const header = `LA RETA · ${result.teams.length} equipos · ${result.diff} de diferencia`;

  const blocks = result.teams.map((team) => {
    const lines = team.lineups.map(
      (lineup) => `· ${lineup.role} ${lineup.player.displayName}`
    );
    return [`${nameOf(team.key)} — ${team.rating}`, ...lines].join("\n");
  });

  return [header, ...blocks].join("\n\n");
}
