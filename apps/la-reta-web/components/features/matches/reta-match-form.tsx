"use client";

import { createMatch, updateMatch } from "@/app/actions/matches";
import type { RetaToMatchItem } from "@/components/features/teams/registro/reta-to-match-list";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { PlayerPicker } from "@/components/features/matches/player-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { SPRING_SETTLE } from "@/components/motion/motion-tokens";
import { formatApiDate } from "@/lib/dates";
import {
  DEFAULT_TEAM_COUNT,
  defaultTeamName,
  isTeamKey,
  MAX_TEAMS,
  TEAM_COLORS,
  teamKeys,
  type TeamKey,
} from "@/lib/teams";
import { cn } from "@/lib/utils";
import {
  ChevronDownIcon,
  LayersIcon,
  PlusIcon,
  SaveIcon,
  XIcon,
} from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

export type MatchPlayer = { id: number; name: string };

/** Un partido ya guardado, listo para editarse (ver `matchTeams`). */
export type EditRetaMatch = {
  id: number;
  playedAt: string;
  balance: number;
  durationSec: number | null;
  notes: string | null;
  teams: { key: TeamKey; name: string; score: number }[];
  scorers: {
    playerId: number | null;
    name: string;
    /** Letra del equipo, o null en partidos viejos sin equipo asignado. */
    team: string | null;
    goals: number;
    assists: number;
  }[];
};

/** Un participante de un equipo: del roster (`playerId`) o invitado. */
type Row = {
  /** `p:<id>` para roster, `g:<nombre>` para invitado. */
  key: string;
  playerId: number | null;
  name: string;
  goals: string;
  assists: string;
};

type Team = { key: TeamKey; name: string; score: string; players: Row[] };

const num = (v: string) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
};

const rosterRow = (playerId: number, name: string): Row => ({
  key: `p:${playerId}`,
  playerId,
  name,
  goals: "0",
  assists: "0",
});

const guestRow = (name: string): Row => ({
  key: `g:${name.toLowerCase()}`,
  playerId: null,
  name,
  goals: "0",
  assists: "0",
});

/** Equipos vacíos para captura manual. */
function blankTeams(count: number): Team[] {
  return teamKeys(count).map((key) => ({
    key,
    name: defaultTeamName(key),
    score: "0",
    players: [],
  }));
}

/** Equipos prellenados con lo que trae una reta generada. */
function teamsFromReta(reta: RetaToMatchItem): Team[] {
  return reta.teams.map((team) => ({
    key: team.key,
    name: team.name,
    score: "0",
    players: reta.players
      .filter((p) => p.team === team.key)
      .map((p) =>
        p.playerId != null
          ? rosterRow(p.playerId, p.name)
          : guestRow(p.guestName ?? p.name)
      ),
  }));
}

const rowFromScorer = (s: EditRetaMatch["scorers"][number]): Row => ({
  key: s.playerId != null ? `p:${s.playerId}` : `g:${s.name.toLowerCase()}`,
  playerId: s.playerId,
  name: s.name,
  goals: String(s.goals),
  assists: String(s.assists),
});

/** Equipos de un partido guardado, con su plantilla ya repartida. */
function teamsFromMatch(match: EditRetaMatch): Team[] {
  return match.teams.map((team) => ({
    key: team.key,
    name: team.name,
    score: String(team.score),
    players: match.scorers
      .filter((s) => s.team === team.key)
      .map(rowFromScorer),
  }));
}

/**
 * Registra una reta como un solo partido con su marcador de N equipos (2 … 6).
 * Se puede armar de cero o prellenar desde una reta generada y ajustar: agregar
 * jugadores que no salieron en la generación, sumar invitados de última hora,
 * quitar a quien no llegó y cambiar nombres, equipos y marcador.
 */
export function RetaMatchForm({
  retas = [],
  players,
  match,
  admin,
  onCancel,
}: {
  retas?: RetaToMatchItem[];
  players: MatchPlayer[];
  /** Presente = modo edición de un partido ya guardado. */
  match?: EditRetaMatch;
  admin: boolean;
  /**
   * Qué pasa al cancelar. El formulario no sabe dónde vive —hoy es un panel
   * plegable en /matches y una página completa en /matches/[id]/edit—, así que
   * quien lo monta decide si además hay que cerrar algo o navegar. Sin este
   * prop se queda con lo razonable por defecto: volver al partido en edición,
   * vaciarse en alta.
   */
  onCancel?: () => void;
}) {
  const router = useRouter();
  const isEdit = Boolean(match);
  const [retaId, setRetaId] = React.useState("");
  const [playedAt, setPlayedAt] = React.useState(match?.playedAt ?? "");
  const [teams, setTeams] = React.useState<Team[]>(() =>
    match ? teamsFromMatch(match) : blankTeams(DEFAULT_TEAM_COUNT)
  );
  const [open, setOpen] = React.useState(isEdit);
  // Partidos viejos pueden traer goleadores sin equipo: se muestran aparte para
  // moverlos a uno, en vez de perderlos.
  const [loose, setLoose] = React.useState<Row[]>(() =>
    match
      ? match.scorers
          .filter((s) => !match.teams.some((t) => t.key === s.team))
          .map(rowFromScorer)
      : []
  );
  const [durationMin, setDurationMin] = React.useState(
    match?.durationSec != null
      ? String(Math.round(match.durationSec / 60))
      : "60"
  );
  const [balance, setBalance] = React.useState(match?.balance ?? 50);
  const [notes, setNotes] = React.useState(match?.notes ?? "");
  const [pending, startTransition] = React.useTransition();

  const playersById = React.useMemo(
    () => new Map(players.map((p) => [p.id, p.name])),
    [players]
  );
  function pickReta(value: string) {
    setRetaId(value);
    const reta = retas.find((r) => String(r.id) === value);
    setTeams(reta ? teamsFromReta(reta) : blankTeams(DEFAULT_TEAM_COUNT));
    setPlayedAt(reta?.playedAt ?? "");
  }

  function patchTeam(index: number, patch: Partial<Team>) {
    setTeams((prev) =>
      prev.map((t, i) => (i === index ? { ...t, ...patch } : t))
    );
  }

  /**
   * Cambia el número de equipos conservando los que ya están capturados. Al
   * reducir, la gente de los equipos que se van pasa a "sin equipo" en vez de
   * borrarse en silencio.
   */
  function setTeamCount(count: number) {
    const keys = teamKeys(count);
    const dropped = teams.slice(keys.length).flatMap((t) => t.players);
    if (dropped.length) {
      setLoose((prev) => [
        ...prev,
        ...dropped.filter((d) => !prev.some((p) => p.key === d.key)),
      ]);
    }
    setTeams(
      keys.map(
        (key, i) =>
          teams[i] ?? {
            key,
            name: defaultTeamName(key),
            score: "0",
            players: [],
          }
      )
    );
  }

  function addRow(index: number, row: Row) {
    setTeams((prev) =>
      prev.map((t, i) =>
        i === index && !t.players.some((p) => p.key === row.key)
          ? { ...t, players: [...t.players, row] }
          : t
      )
    );
  }

  function removeRow(index: number, key: string) {
    setTeams((prev) =>
      prev.map((t, i) =>
        i === index
          ? {
              ...t,
              players: t.players.filter((p) => p.key !== key),
              score: String(
                t.players
                  .filter((p) => p.key !== key)
                  .reduce((n, p) => n + num(p.goals), 0)
              ),
            }
          : t
      )
    );
  }

  /** Manda un goleador sin equipo al equipo elegido, con sus goles. */
  function assignLoose(key: string, teamKey: TeamKey) {
    const row = loose.find((r) => r.key === key);
    if (!row) return;
    setLoose((prev) => prev.filter((r) => r.key !== key));
    setTeams((prev) =>
      prev.map((t) =>
        t.key === teamKey && !t.players.some((p) => p.key === row.key)
          ? {
              ...t,
              players: [...t.players, row],
              score: String(
                [...t.players, row].reduce((n, p) => n + num(p.goals), 0)
              ),
            }
          : t
      )
    );
  }

  /**
   * Deja el formulario como recién abierto. Lo comparten cancelar y guardar:
   * cuando estaba duplicado, la copia de `submit` se olvidaba de `loose` y los
   * goleadores sin equipo se colaban en el registro siguiente.
   */
  function resetForm() {
    setRetaId("");
    setTeams(blankTeams(DEFAULT_TEAM_COUNT));
    setLoose([]);
    setPlayedAt("");
    setDurationMin("60");
    setBalance(50);
    setNotes("");
  }

  function cancel() {
    if (onCancel) {
      onCancel();
      return;
    }
    if (match) {
      router.push(`/matches/${match.id}/detail`);
      return;
    }
    resetForm();
  }

  /** Escribe goles/asistencias y refleja el marcador del equipo. */
  function setStat(index: number, key: string, patch: Partial<Row>) {
    setTeams((prev) =>
      prev.map((team, i) => {
        if (i !== index) return team;
        const rows = team.players.map((p) =>
          p.key === key ? { ...p, ...patch } : p
        );
        return {
          ...team,
          players: rows,
          score:
            patch.goals !== undefined
              ? String(rows.reduce((n, p) => n + num(p.goals), 0))
              : team.score,
        };
      })
    );
  }

  function submit() {
    const payload = teams.map((t, i) => ({
      key: t.key,
      name: t.name.trim() || defaultTeamName(t.key),
      score: num(t.score),
      index: i,
    }));

    const input = {
      playedAt: playedAt || formatApiDate(),
      teamAName: payload[0].name,
      teamBName: payload[1].name,
      teamAKey: payload[0].key,
      teamBKey: payload[1].key,
      // Con 2 equipos manda el par de siempre; con 3+ el marcador va en `teams`.
      teams: payload.map(({ key, name, score }) => ({ key, name, score })),
      scoreA: payload[0].score,
      scoreB: payload[1].score,
      balance,
      durationSec: durationMin.trim() ? num(durationMin) * 60 || null : null,
      notes,
      generatedRetaId: retaId ? Number(retaId) : null,
      // Asistencia completa: quien no anotó queda en 0, con su equipo. Los
      // sueltos se conservan sin equipo (updateMatch reemplaza la lista).
      scorers: [
        ...teams.flatMap((team) =>
          team.players.map((p) => ({
            playerId: p.playerId,
            guestName: p.playerId == null ? p.name : undefined,
            team: team.key as string,
            goals: num(p.goals),
            assists: num(p.assists),
          }))
        ),
        ...loose.map((p) => ({
          playerId: p.playerId,
          guestName: p.playerId == null ? p.name : undefined,
          team: null,
          goals: num(p.goals),
          assists: num(p.assists),
        })),
      ],
    };

    startTransition(async () => {
      const res = match
        ? await updateMatch(match.id, input)
        : await createMatch(input);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      if (match) {
        toast.success("Partido actualizado");
        router.push(`/matches/${match.id}/detail`);
        router.refresh();
        return;
      }
      toast.success("Reta registrada en el historial");
      resetForm();
      router.refresh();
    });
  }

  return (
    <Collapsible
      render={<Card />}
      className={cn(!isEdit && "p-0")}
      open={open}
      onOpenChange={setOpen}
      defaultOpen={isEdit}
      disabled={isEdit}
    >
      <CollapsibleTrigger
        render={<CardHeader />}
        className={cn(
          !isEdit &&
            "hover:bg-muted cursor-pointer border-b pt-6 transition-colors select-none"
        )}
      >
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="bg-primary/10 text-primary grid size-7 place-items-center rounded-lg transition">
            <LayersIcon className="size-4" />
          </span>
          {isEdit ? (
            "Editar la reta"
          ) : (
            <span className="inline-flex items-center justify-start gap-1">
              Registrar una reta{" "}
              <ChevronDownIcon
                className={cn("transition", open && "rotate-180")}
              />
            </span>
          )}
        </CardTitle>
        <CardDescription>
          {isEdit
            ? "Cambia nombres, marcador y plantillas. Puedes agregar equipos, jugadores e invitados, o quitar a quien no jugó."
            : "Ármala a mano o parte de una reta generada y ajústala: puedes agregar jugadores que no salieron en la generación, sumar invitados y quitar a quien no llegó."}
        </CardDescription>
      </CollapsibleTrigger>
      <CollapsibleContent render={<CardContent />} className="space-y-4 pb-6">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto]">
          {isEdit ? (
            <div className="hidden sm:block" />
          ) : (
            <div>
              <Label className="mb-1.5 block text-xs">
                Partir de una reta generada (opcional)
              </Label>
              <NativeSelect
                className="w-full"
                value={retaId}
                onChange={(e) => pickReta(e.target.value)}
              >
                <NativeSelectOption value="">
                  — armar a mano —
                </NativeSelectOption>
                {retas.map((r) => (
                  <NativeSelectOption key={r.id} value={String(r.id)}>
                    {r.dateLabel} · {r.teams.length} equipos ·{" "}
                    {r.players.length} jugadores ·{" "}
                    {r.teams.map((t) => t.name).join(" / ")}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
          )}
          <div>
            <Label className="mb-1.5 block text-xs">Equipos</Label>
            <NativeSelect
              value={String(teams.length)}
              onChange={(e) => setTeamCount(Number(e.target.value))}
            >
              {Array.from({ length: MAX_TEAMS - 1 }, (_, i) => i + 2).map(
                (n) => (
                  <NativeSelectOption key={n} value={String(n)}>
                    {n}
                  </NativeSelectOption>
                )
              )}
            </NativeSelect>
          </div>
          <div>
            <Label className="mb-1.5 block text-xs">Fecha</Label>
            <Input
              type="date"
              value={playedAt}
              onChange={(e) => setPlayedAt(e.target.value)}
            />
          </div>
        </div>

        {/* Pasar de 2 a 4 equipos reparte la rejilla de golpe y cuesta seguir
            qué se movió a dónde. `layout` interpola la posición real de cada
            tarjeta y `AnimatePresence` da entrada y salida a las que aparecen o
            se van: es justo lo que el CSS no puede hacer, porque nadie conoce
            las coordenadas de antes y después más que el navegador. */}
        {/* `layout` también en la rejilla: `popLayout` saca del flujo a la
            tarjeta que se va, así que sin esto la altura del contenedor cambia
            de golpe y lo que hay debajo salta encima de la que todavía se está
            despidiendo. */}
        <m.div className="grid gap-4 lg:grid-cols-2" layout>
          <AnimatePresence initial={false} mode="popLayout">
            {teams.map((team, i) => (
              <m.div
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                initial={{ opacity: 0, scale: 0.92 }}
                key={team.key}
                layout
                transition={SPRING_SETTLE}
              >
                <TeamCard
                  onAdd={(row) => addRow(i, row)}
                  onPatch={(patch) => patchTeam(i, patch)}
                  onRemove={(key) => removeRow(i, key)}
                  onStat={(key, patch) => setStat(i, key, patch)}
                  players={players}
                  playersById={playersById}
                  team={team}
                />
              </m.div>
            ))}
          </AnimatePresence>
        </m.div>

        {loose.length > 0 && (
          <LooseCard
            rows={loose}
            teams={teams}
            onAssign={assignLoose}
            onRemove={(key) =>
              setLoose((prev) => prev.filter((r) => r.key !== key))
            }
            onStat={(key, patch) =>
              setLoose((prev) =>
                prev.map((r) => (r.key === key ? { ...r, ...patch } : r))
              )
            }
          />
        )}

        {/* Detalles opcionales, juntos y con menos peso: sueltos entre los
            equipos competían por la atención con el marcador, que es lo único
            que hay que capturar sí o sí. */}
        <fieldset className="bg-muted/30 space-y-4 rounded-xl border border-dashed p-3">
          <legend className="text-muted-foreground px-1 text-xs font-semibold tracking-wide uppercase">
            Detalles (opcional)
          </legend>
          <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
            <div>
              <Label className="mb-1.5 block text-xs">Duración (min)</Label>
              <Input
                type="number"
                min={0}
                value={durationMin}
                onChange={(e) => setDurationMin(e.target.value)}
                placeholder="60"
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs">Notas</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Cómo estuvo la reta…"
                rows={2}
              />
            </div>
          </div>

          <div>
            <Label className="mb-1.5 block text-xs">
              Qué tan pareja estuvo ·{" "}
              <span className="text-foreground font-mono font-bold tabular-nums">
                {balance}
              </span>
            </Label>
            <Slider
              min={0}
              max={100}
              value={balance}
              onValueChange={(v) =>
                setBalance(Array.isArray(v) ? v[0] : (v as number))
              }
            />
          </div>
        </fieldset>

        {admin ? (
          <div className="flex flex-col gap-2 sm:flex-row-reverse xl:justify-between">
            <Button type="button" size="lg" disabled={pending} onClick={submit}>
              <SaveIcon />
              {pending
                ? "Guardando…"
                : isEdit
                  ? "Guardar cambios"
                  : "Registrar la reta"}
            </Button>

            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    disabled={pending}
                  >
                    <XIcon />
                    Cancelar
                  </Button>
                }
              />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {isEdit ? "Descartar los cambios" : "Limpiar el formulario"}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {isEdit
                      ? "Lo que ajustaste aquí no se guardará y volverás al partido tal como está."
                      : "Se borrará todo lo que llevas capturado de esta reta. No se guarda nada."}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Seguir editando</AlertDialogCancel>
                  <AlertDialogAction onClick={cancel}>
                    {isEdit ? "Descartar" : "Limpiar"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ) : (
          <p className="text-muted-foreground text-center text-sm">
            Entra como admin para guardar.
          </p>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

function TeamCard({
  team,
  players,
  playersById,
  onPatch,
  onAdd,
  onRemove,
  onStat,
}: {
  team: Team;
  players: MatchPlayer[];
  playersById: Map<number, string>;
  onPatch: (patch: Partial<Team>) => void;
  onAdd: (row: Row) => void;
  onRemove: (key: string) => void;
  onStat: (key: string, patch: Partial<Row>) => void;
}) {
  const [guestName, setGuestName] = React.useState("");
  const color = TEAM_COLORS[team.key];
  // El filtro es por equipo, no global: alguien pudo jugar en varias retas del
  // día y aparecer en más de un equipo. Aquí solo se evita repetirlo dentro del
  // mismo equipo — sus goles se guardan por separado en cada uno.
  const available = players.filter(
    (p) => !team.players.some((row) => row.playerId === p.id)
  );

  function addGuest() {
    const name = guestName.trim().slice(0, 60);
    if (!name) return;
    onAdd(guestRow(name));
    setGuestName("");
  }

  return (
    // El color del equipo deja de ser un puntito de 10 px y pasa a teñir la
    // tarjeta entera: filo de acento arriba y un velo del mismo tono en la
    // cabecera. Con cuatro equipos en pantalla, eso es lo que permite saber en
    // cuál estás escribiendo sin leer el nombre.
    // El color del equipo no se pinta siempre: la tarjeta se enciende con él
    // mientras se escribe dentro (`.team-panel`, en globals.css). Así el color
    // dice dónde estás en vez de ser decoración permanente.
    <div
      className="team-panel h-full rounded-xl border pt-3"
      style={{ "--team": color } as React.CSSProperties}
    >
      <div className="flex items-center gap-2 px-3">
        <span
          aria-hidden="true"
          className="size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
        />
        <Input
          value={team.name}
          onChange={(e) => onPatch({ name: e.target.value })}
          placeholder={defaultTeamName(team.key)}
          maxLength={24}
          aria-label={`Nombre del ${defaultTeamName(team.key)}`}
          className="focus-visible:border-input h-9 min-w-0 flex-1 border-transparent bg-transparent px-1 text-base font-bold shadow-none"
        />
        {/* El marcador es el dato que se viene a capturar: mono y grande para
            que gane a los demás campos, pero sin color fijo. */}
        <Input
          type="number"
          min={0}
          value={team.score}
          onChange={(e) => onPatch({ score: e.target.value })}
          className="h-11 w-16 text-center font-mono text-xl font-black tabular-nums"
          aria-label={`Goles de ${team.name}`}
        />
      </div>
      <div className="space-y-3 px-3 pt-3 pb-3">
        {team.players.length > 0 ? (
          <>
            <div className="text-muted-foreground grid grid-cols-[1fr_3rem_3rem_2rem] gap-2 text-[10px] font-semibold tracking-wide uppercase">
              <span />
              <span className="text-center">Goles</span>
              <span className="text-center">Asist.</span>
              <span />
            </div>
            {team.players.map((p) => (
              <div
                key={p.key}
                className="grid grid-cols-[1fr_3rem_3rem_2rem] items-center gap-2"
              >
                <span className="min-w-0 truncate text-sm">
                  {p.playerId != null
                    ? (playersById.get(p.playerId) ?? p.name)
                    : p.name}
                  {p.playerId == null && (
                    <span className="text-muted-foreground text-[10px]">
                      {" "}
                      · invitado
                    </span>
                  )}
                </span>
                <Input
                  type="number"
                  min={0}
                  value={p.goals}
                  onChange={(e) => onStat(p.key, { goals: e.target.value })}
                  className="h-8 px-1 text-center"
                  aria-label={`Goles de ${p.name}`}
                />
                <Input
                  type="number"
                  min={0}
                  value={p.assists}
                  onChange={(e) => onStat(p.key, { assists: e.target.value })}
                  className="h-8 px-1 text-center"
                  aria-label={`Asistencias de ${p.name}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Quitar a ${p.name}`}
                  onClick={() => onRemove(p.key)}
                >
                  <XIcon />
                </Button>
              </div>
            ))}
          </>
        ) : (
          <p className="text-muted-foreground text-xs">
            Sin jugadores todavía. Agrégalos abajo.
          </p>
        )}

        {/* Altas: roster (los que ya están en otro equipo no aparecen) e invitados. */}
        <div className="space-y-2 border-t pt-3">
          <PlayerPicker
            onPick={(picked) =>
              onAdd(
                rosterRow(picked.id, playersById.get(picked.id) ?? picked.name)
              )
            }
            players={available}
          />
          <div className="flex gap-2">
            <Input
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addGuest();
                }
              }}
              placeholder="Invitado de última hora"
              maxLength={60}
              className="h-9"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Agregar invitado"
              disabled={!guestName.trim()}
              onClick={addGuest}
            >
              <PlusIcon />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Goleadores de partidos viejos que quedaron sin equipo. Se listan aparte con
 * un select para mandarlos al equipo que les toca (se llevan sus goles).
 */
function LooseCard({
  rows,
  teams,
  onAssign,
  onRemove,
  onStat,
}: {
  rows: Row[];
  teams: Team[];
  onAssign: (key: string, teamKey: TeamKey) => void;
  onRemove: (key: string) => void;
  onStat: (key: string, patch: Partial<Row>) => void;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-dashed p-3">
      <p className="text-sm font-semibold">
        Sin equipo asignado
        <span className="text-muted-foreground ml-1 text-xs font-normal">
          · asígnalos para que cuenten en el marcador
        </span>
      </p>
      {rows.map((p) => (
        <div
          key={p.key}
          className="grid grid-cols-[1fr_auto_3rem_3rem_2rem] items-center gap-2"
        >
          <span className="min-w-0 truncate text-sm">{p.name}</span>
          <NativeSelect
            value=""
            className="h-8"
            aria-label={`Mover a ${p.name} a un equipo`}
            onChange={(e) => {
              const key = e.target.value;
              if (isTeamKey(key)) onAssign(p.key, key);
            }}
          >
            <NativeSelectOption value="">Mover a…</NativeSelectOption>
            {teams.map((t) => (
              <NativeSelectOption key={t.key} value={t.key}>
                {t.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <Input
            type="number"
            min={0}
            value={p.goals}
            onChange={(e) => onStat(p.key, { goals: e.target.value })}
            className="h-8 px-1 text-center"
            aria-label={`Goles de ${p.name}`}
          />
          <Input
            type="number"
            min={0}
            value={p.assists}
            onChange={(e) => onStat(p.key, { assists: e.target.value })}
            className="h-8 px-1 text-center"
            aria-label={`Asistencias de ${p.name}`}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Quitar a ${p.name}`}
            onClick={() => onRemove(p.key)}
          >
            <XIcon />
          </Button>
        </div>
      ))}
    </div>
  );
}
