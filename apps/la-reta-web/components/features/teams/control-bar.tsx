"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MAX_TEAMS } from "@/lib/teams";
import { cn } from "@/lib/utils";
import {
  ChartNoAxesColumnIcon,
  ListChecksIcon,
  RadioIcon,
  Settings2Icon,
  ShuffleIcon,
  XIcon,
} from "lucide-react";
import { useMemo } from "react";
import { SelectedCountItem } from "./selected-count-item";

export type MatchupView = "board" | "list";

/**
 * Barra de "Armar equipos", en tres zonas para que no se lea como un montón de
 * botones sueltos:
 *
 *  1. Estado — cuántos van convocados, más los accesos secundarios (registros,
 *     preferencias).
 *  2. Ajustes de la generación — a quién convocas y en cuántos equipos.
 *  3. La acción — generar (y de ahí al live).
 */
export const ControlBar = ({
  selectedCount,
  allSelected,
  hasSelection,
  hasResult,
  teamCount,
  maxTeams,
  resetOnEdit,
  onResetOnEditChange,
  onTeamCountChange,
  onToggleAll,
  onClear,
  onGenerate,
  generateDisabled,
  onGoLive,
  onRegistro,
}: {
  readonly selectedCount: number;
  readonly allSelected: boolean;
  readonly hasSelection: boolean;
  readonly hasResult: boolean;
  readonly teamCount: number;
  /** Tope real: no puede haber más equipos que convocados. */
  readonly maxTeams: number;
  /** Volver a repartir al editar la convocatoria o los invitados. */
  readonly resetOnEdit: boolean;
  readonly onResetOnEditChange: (value: boolean) => void;
  readonly onTeamCountChange: (count: number) => void;
  readonly onToggleAll: () => void;
  readonly onClear: () => void;
  readonly onGenerate: () => void;
  readonly generateDisabled: boolean;
  readonly onGoLive: () => void;
  readonly onRegistro: () => void;
}) => {
  return (
    <Card size="sm">
      <CardContent className="space-y-3">
        {/* 1 · Estado + secundarias */}
        <div className="flex items-center justify-between gap-2">
          <SelectedCountItem count={selectedCount} />
          <div className="flex items-center gap-2">
            <PreferencesPopover
              resetOnEdit={resetOnEdit}
              onResetOnEditChange={onResetOnEditChange}
            />
            <Button variant="default" onClick={onRegistro}>
              <ChartNoAxesColumnIcon />
              <span className="hidden sm:inline">Registros</span>
            </Button>
          </div>
        </div>

        <Separator />

        {/* 2 · Ajustes de la generación · 3 · la acción */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-wrap items-start gap-4">
            <Field label="Convocatoria">
              <Button variant="outline" onClick={onToggleAll}>
                <ListChecksIcon />
                {allSelected ? "Quitar todos" : "Todos"}
              </Button>
              {hasSelection ? (
                <Button variant="outline" onClick={onClear}>
                  <XIcon />
                  Limpiar
                </Button>
              ) : null}
            </Field>

            <Field label="Equipos">
              <TeamCountPicker
                value={teamCount}
                max={maxTeams}
                onChange={onTeamCountChange}
              />
            </Field>
          </div>

          <div className="flex gap-2">
            <Button
              className="flex-1 lg:flex-none"
              onClick={onGenerate}
              disabled={generateDisabled}
            >
              <ShuffleIcon />
              {hasResult ? "Regenerar" : "Generar equipos"}
            </Button>
            {hasResult ? (
              <Button
                variant="destructive"
                className="flex-1 lg:flex-none"
                onClick={onGoLive}
              >
                <RadioIcon />
                Ir al live
              </Button>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

/** Grupo de controles con su etiqueta, para que se lea qué hace cada cosa. */
const Field = ({
  label,
  children,
}: {
  readonly label: string;
  readonly children: React.ReactNode;
}) => {
  return (
    <div className="space-y-1.5">
      <span className="text-muted-foreground block text-[11px] font-semibold tracking-wide uppercase">
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
};

/**
 * Casa de las preferencias del generador. Hoy vive una sola; el popover existe
 * para que las que vengan no vuelvan a llenar la barra.
 */
const PreferencesPopover = ({
  resetOnEdit,
  onResetOnEditChange,
}: {
  readonly resetOnEdit: boolean;
  readonly onResetOnEditChange: (value: boolean) => void;
}) => {
  return (
    <Popover>
      {/* Botón solo de icono: el tooltip dice qué abre. */}
      <Tooltip>
        <TooltipTrigger
          render={
            <PopoverTrigger
              render={
                <Button variant="outline" size="icon" aria-label="Preferencias">
                  <Settings2Icon />
                </Button>
              }
            />
          }
        />
        <TooltipContent>Preferencias</TooltipContent>
      </Tooltip>
      <PopoverContent align="end" className="w-80">
        <PopoverHeader>
          <PopoverTitle>Preferencias</PopoverTitle>
          <PopoverDescription>
            Cómo se comporta el generador. Se guardan en este navegador.
          </PopoverDescription>
        </PopoverHeader>
        <Setting
          id="reset-on-edit"
          label="Reiniciar al editar"
          hint="Encendido: agregar, editar o quitar convocados vuelve a repartir todos los equipos. Apagado: el tablero se conserva y quien entra queda “por asignar”."
          checked={resetOnEdit}
          onCheckedChange={onResetOnEditChange}
        />
      </PopoverContent>
    </Popover>
  );
};

const Setting = ({
  id,
  label,
  hint,
  checked,
  onCheckedChange,
}: {
  readonly id: string;
  readonly label: string;
  readonly hint: string;
  readonly checked: boolean;
  readonly onCheckedChange: (value: boolean) => void;
}) => {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <Label htmlFor={id} className="cursor-pointer text-sm font-medium">
          {label}
        </Label>
        <p className="text-muted-foreground mt-1 text-xs leading-snug">
          {hint}
        </p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
};

/**
 * Cuántos equipos generar. 2 es el default de siempre; con 3+ el marcador en
 * vivo enseña un botón de gol por equipo.
 */
const TeamCountPicker = ({
  value,
  max,
  onChange,
}: {
  readonly value: number;
  readonly max: number;
  readonly onChange: (count: number) => void;
}) => {
  const options = Array.from(
    { length: Math.max(2, Math.min(MAX_TEAMS, max)) - 1 },
    (_, i) => i + 2
  );
  const isEmpty = options.length < 2;

  return (
    <fieldset
      className="bg-muted inline-flex items-center gap-0.5 rounded-xl border-0 p-0.5"
      aria-label="Número de equipos"
    >
      {options.map((n) => (
        <button
          key={n}
          type="button"
          disabled={isEmpty}
          onClick={() => onChange(n)}
          aria-pressed={value === n}
          className={cn(
            "rounded-[10px] px-3 py-1.5 font-mono text-xs font-bold tabular-nums transition-colors",
            value === n
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {n}
        </button>
      ))}
    </fieldset>
  );
};
