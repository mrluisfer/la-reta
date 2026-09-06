"use client";

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
import { FlagIcon, TrashIcon } from "lucide-react";
import type { LiveStanding } from "./live-scoreboard";

/**
 * Cerrar la reta o tirarla. Las dos piden confirmación porque las dos son
 * irreversibles: una escribe en el registro y la otra borra el marcador.
 */
export const LiveActions = ({
  standings,
  pending,
  onFinalize,
  onDiscard,
}: {
  readonly standings: LiveStanding[];
  readonly pending: boolean;
  readonly onFinalize: () => void;
  readonly onDiscard: () => void;
}) => {
  const manyTeams = standings.length > 2;
  const resumen = standings
    .map(({ side, score }) => `${side.name} ${score}`)
    .join(" · ");

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <AlertDialog>
        <AlertDialogTrigger
          render={
            <Button className="flex-1" disabled={pending} size="lg">
              <FlagIcon />
              {manyTeams ? "Finalizar reta" : "Finalizar partido"}
            </Button>
          }
        />
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finalizar y guardar</AlertDialogTitle>
            <AlertDialogDescription>
              {resumen}. Se guarda como un registro con la duración y los goles
              de cada quien.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>
              Seguir jugando
            </AlertDialogCancel>
            <AlertDialogAction disabled={pending} onClick={onFinalize}>
              {pending ? "Guardando..." : "Finalizar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog>
        <AlertDialogTrigger
          render={
            <Button
              className="sm:w-auto"
              disabled={pending}
              size="lg"
              variant="destructive"
            >
              <TrashIcon />
              Descartar
            </Button>
          }
        />
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar partido en vivo</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará el marcador actual y no se guardará nada en el
              registro.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction disabled={pending} onClick={onDiscard}>
              Descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
