"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import {
  GROUP_COLOR,
  GROUP_LABEL,
  positionGroup,
  type PositionGroup,
} from "@/lib/constants";
import { isGuest } from "@/lib/guests";
import { cn } from "@/lib/utils";
import { CircleHelpIcon, SearchIcon, XIcon } from "lucide-react";
import * as React from "react";
import { initialsOf, searchKey } from "./live-match-utilities";
import type { LivePlayer } from "./types";

/**
 * De arriba abajo, de quien más anota a quien menos.
 *
 * Es el orden inverso al de la plantilla (`GK → FWD`, que es como se alinea un
 * equipo) porque aquí la pregunta no es "cómo se forma", es "quién la metió":
 * dejar a los delanteros al final obligaba a recorrer toda la lista en la
 * respuesta más probable, y el portero —el caso más raro de todos— se llevaba
 * el sitio de honor.
 */
const GROUPS: PositionGroup[] = ["FWD", "MID", "DEF", "GK"];

export const ScorerPickerDrawer = ({
  open,
  attrTeam,
  teamColor,
  minute,
  filter,
  players,
  goalCounts,
  onFilterChange,
  onOpenChange,
  onSelectAnonymous,
  onSelectPlayer,
}: {
  readonly open: boolean;
  readonly attrTeam: string;
  /** Color del equipo que anotó: el mismo del botón que abrió esto. */
  readonly teamColor: string;
  /** Minuto del gol ya formateado, o "" si el partido no tiene reloj. */
  readonly minute: string;
  readonly filter: string;
  /** Ya filtrados por el padre (con `useDeferredValue`). */
  readonly players: LivePlayer[];
  /** Goles que lleva cada jugador en ESTE equipo, para sugerir a los de siempre. */
  readonly goalCounts: Map<number, number>;
  readonly onFilterChange: (value: string) => void;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSelectAnonymous: () => void;
  readonly onSelectPlayer: (playerId: number) => void;
}) => {
  const searching = filter.trim().length > 0;

  // Quien ya anotó vuelve a anotar: en una reta el goleador se repite, y
  // tenerlo arriba ahorra recorrer veinte caras cada vez.
  const repeaters = searching
    ? []
    : players
        .filter((player) => (goalCounts.get(player.id) ?? 0) > 0)
        .sort(
          (a, b) => (goalCounts.get(b.id) ?? 0) - (goalCounts.get(a.id) ?? 0)
        );

  const byGroup = searching
    ? []
    : GROUPS.map((group) => ({
        group,
        items: players.filter((p) => positionGroup(p.position) === group),
      })).filter((section) => section.items.length > 0);

  /**
   * Enter asigna cuando la búsqueda ya dejó a uno solo. Escribir "alv" y pulsar
   * Enter es un gesto que quien apunta los goles repite veinte veces por reta.
   */
  function onSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" && players.length === 1) {
      event.preventDefault();
      onSelectPlayer(players[0].id);
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} showSwipeHandle>
      {/* El default del primitivo reserva 6rem arriba. En un teléfono de 667 px
          eso es una sexta parte de la lista; aquí se recorta a lo justo para
          seguir viendo que hay algo detrás. */}
      <DrawerContent className="[--drawer-content-max-height:calc(100dvh-2rem)]">
        <DrawerHeader className="gap-2 pb-3 text-left sm:text-left">
          <div className="mx-auto flex w-full max-w-2xl flex-col gap-2">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-[0.12em] text-white uppercase"
                style={{ backgroundColor: teamColor }}
              >
                {attrTeam}
              </span>
              {minute ? (
                <span className="text-muted-foreground font-mono text-xs tabular-nums">
                  {minute}
                </span>
              ) : null}
            </div>

            <DrawerTitle className="text-lg sm:text-xl">
              ¿Quién anotó?
            </DrawerTitle>
            <DrawerDescription className="sr-only">
              Elige al goleador de la plantilla o deja el gol sin asignar para
              atribuirlo más tarde.
            </DrawerDescription>

            <SearchField
              value={filter}
              onChange={onFilterChange}
              onKeyDown={onSearchKeyDown}
            />
          </div>
        </DrawerHeader>

        {/* `min-h-0` es lo que deja encogerse a un hijo flex: sin él, la lista
            empuja al popup y el botón de "no sé quién fue" sale de pantalla.

            `contain: paint` acota la invalidación a esta caja. El popup del
            drawer vive con `will-change: transform` y detrás corre el marcador
            (reloj y punto de "en vivo" animándose sin parar) bajo el
            `backdrop-filter` del overlay; sin contención, Chrome perdía
            regiones al repintar y la lista aparecía a medio dibujar. */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 [contain:paint]">
          <div className="mx-auto w-full max-w-2xl pb-2">
            {players.length === 0 ? (
              <EmptyResult filter={filter} onClear={() => onFilterChange("")} />
            ) : searching ? (
              <PlayerGrid
                players={players}
                goalCounts={goalCounts}
                onSelect={onSelectPlayer}
              />
            ) : (
              <div className="space-y-4">
                {repeaters.length > 0 && (
                  <Section title="Ya anotaron" dotColor={teamColor}>
                    <PlayerGrid
                      players={repeaters}
                      goalCounts={goalCounts}
                      onSelect={onSelectPlayer}
                    />
                  </Section>
                )}

                {byGroup.map(({ group, items }) => (
                  <Section
                    key={group}
                    title={GROUP_LABEL[group]}
                    dotColor={GROUP_COLOR[group]}
                  >
                    <PlayerGrid
                      players={items}
                      goalCounts={goalCounts}
                      onSelect={onSelectPlayer}
                    />
                  </Section>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* La salida honesta, siempre a mano y nunca escondida al final del
            scroll: en la cancha pasa constantemente que nadie vio quién la
            metió, y forzar a inventar un nombre ensucia las estadísticas. */}
        <DrawerFooter className="border-foreground/8 bg-popover border-t pt-3">
          <div className="mx-auto w-full max-w-2xl">
            <Button
              variant="outline"
              size="lg"
              className="h-auto w-full justify-start gap-3 py-2.5 text-left"
              onClick={onSelectAnonymous}
            >
              <CircleHelpIcon className="size-5 shrink-0" />
              <span className="flex min-w-0 flex-col">
                <span className="font-semibold">No sé quién fue</span>
                <span className="text-muted-foreground text-xs font-normal">
                  El gol cuenta igual y se le pone nombre después
                </span>
              </span>
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

const SearchField = ({
  value,
  onChange,
  onKeyDown,
}: {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
}) => {
  const ref = React.useRef<HTMLInputElement>(null);

  /**
   * El foco automático solo con ratón. En el teléfono, enfocar al abrir levanta
   * el teclado y se come la mitad de la lista justo cuando lo que se quiere es
   * reconocer una cara; en escritorio, en cambio, teclear el nombre es más
   * rápido que apuntar con el ratón.
   */
  React.useEffect(() => {
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      ref.current?.focus();
    }
  }, []);

  return (
    <div className="relative">
      <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
      <Input
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Buscar por nombre o apodo..."
        aria-label="Buscar jugador"
        enterKeyHint="done"
        className="h-11 pr-10 pl-9"
      />
      {value.length > 0 && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Limpiar búsqueda"
          className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full transition-colors"
        >
          <XIcon className="size-4" />
        </button>
      )}
    </div>
  );
};

const Section = ({
  title,
  dotColor,
  children,
}: {
  readonly title: string;
  readonly dotColor: string;
  readonly children: React.ReactNode;
}) => {
  return (
    <section className="space-y-2">
      {/* Sticky para no perder de vista en qué línea vas cuando la plantilla es
          larga y el teléfono corto.

          Fondo OPACO y sin `backdrop-blur`. Con el blur, Chrome dejaba media
          lista sin pintar al recorrerla —tarjetas fantasma con solo el círculo
          del avatar, justo debajo de cada encabezado—: un `backdrop-filter` en
          un elemento `sticky` dentro de un scroller obliga a recomponer el
          fondo en cada fotograma y la invalidación se pierde. Aquí el blur no
          aportaba nada porque el fondo ya tapaba casi del todo. */}
      <h3 className="bg-popover text-muted-foreground sticky top-0 z-10 flex items-center gap-1.5 py-1.5 text-[10px] font-semibold tracking-[0.14em] uppercase">
        <span
          className="size-2 shrink-0 rounded-full"
          style={{ backgroundColor: dotColor }}
        />
        {title}
      </h3>
      {children}
    </section>
  );
};

const PlayerGrid = ({
  players,
  goalCounts,
  onSelect,
}: {
  readonly players: LivePlayer[];
  readonly goalCounts: Map<number, number>;
  readonly onSelect: (playerId: number) => void;
}) => {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {players.map((player) => (
        <PlayerRow
          key={player.id}
          player={player}
          goals={goalCounts.get(player.id) ?? 0}
          onSelect={() => onSelect(player.id)}
        />
      ))}
    </div>
  );
};

const PlayerRow = ({
  player,
  goals,
  onSelect,
}: {
  readonly player: LivePlayer;
  readonly goals: number;
  readonly onSelect: () => void;
}) => {
  const color = GROUP_COLOR[positionGroup(player.position)];
  // El apodo solo cuando dice algo que el nombre no diga ya: "MIKOHEL" bajo
  // "Mikohel Haaland" es ruido, "CHOUCHA" bajo "Luis Álvarez" es justo el dato
  // por el que se le reconoce en la cancha.
  const nickname = player.displayName.trim();
  const showNickname =
    nickname.length > 0 &&
    !searchKey(player.name).includes(searchKey(nickname));

  const scored = goals > 0;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group flex items-center gap-3 rounded-xl border p-2 text-left",
        // `scale` y no `transform`: Tailwind v4 emite la propiedad
        // independiente, así que listar `transform` no transicionaba nada y el
        // `active:` saltaba en seco.
        "transition-[background-color,border-color,scale] duration-150",
        "active:scale-[0.985]",
        "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
        // Quien ya anotó se distingue en TODA la lista, no solo en su sección
        // de arriba: el borde discontinuo y el tinte lo señalan también dentro
        // de su línea, que es donde se le busca cuando repite. Discontinuo y no
        // sólido para que no compita con el foco de teclado, que sí es sólido.
        //
        // Emerald explícito y no `border-primary`/`text-primary`: en tema
        // oscuro `--primary` es #005f46, y el contador encima dejaba el número
        // en 2.3:1 — ilegible. Medido, esta pareja da 3.65/4.85 en el borde y
        // 5.36/11.64 en el número (claro/oscuro).
        //
        // El hover INTENSIFICA el verde en vez de sustituirlo. Con el
        // `hover:bg-accent` común a todas las filas, pasar el ratón por encima
        // de un goleador le apagaba el tinte a gris y se lo devolvía al salir:
        // se leía como un parpadeo, justo en las filas que más miras.
        scored
          ? "border-dashed border-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20 dark:border-emerald-400 dark:bg-emerald-400/10 dark:hover:bg-emerald-400/20"
          : "border-border bg-card hover:bg-accent hover:border-foreground/20"
      )}
    >
      <Avatar className="size-11 shrink-0">
        {player.photoUrl ? (
          <AvatarImage src={player.photoUrl} alt="" width={96} />
        ) : null}
        <AvatarFallback className="text-xs font-semibold">
          {initialsOf(player.name)}
        </AvatarFallback>
      </Avatar>

      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-semibold">{player.name}</span>
        <span className="mt-0.5 flex items-center gap-1.5">
          <span
            className="rounded px-1 py-px font-mono text-[10px] font-bold"
            style={{
              backgroundColor: `${color}24`,
              color,
            }}
          >
            {player.position}
          </span>
          {showNickname ? (
            <span className="text-muted-foreground truncate text-[11px]">
              {nickname}
            </span>
          ) : null}
          {isGuest(player) && (
            <span className="text-muted-foreground bg-muted shrink-0 rounded px-1 py-px text-[10px] font-medium">
              Invitado
            </span>
          )}
        </span>
      </span>

      {scored ? (
        <span
          className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-700 tabular-nums dark:text-emerald-300"
          title={`Lleva ${goals} gol${goals === 1 ? "" : "es"} con este equipo`}
        >
          {goals}
        </span>
      ) : null}
      <span className="text-muted-foreground/70 shrink-0 pr-1 font-mono text-xs font-bold tabular-nums">
        {player.overall}
      </span>
    </button>
  );
};

const EmptyResult = ({
  filter,
  onClear,
}: {
  readonly filter: string;
  readonly onClear: () => void;
}) => {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <p className="text-muted-foreground text-sm">
        Nadie de la plantilla coincide con{" "}
        <span className="text-foreground font-semibold">“{filter.trim()}”</span>
        .
      </p>
      <Button variant="outline" size="sm" onClick={onClear}>
        Ver a todos
      </Button>
    </div>
  );
};
