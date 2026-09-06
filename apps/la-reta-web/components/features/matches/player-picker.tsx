"use client";

import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { useState } from "react";

export type PickablePlayer = { id: number; name: string };

/**
 * Selector de jugador con buscador.
 *
 * Sustituye al `<select>` nativo: con veinte y pico de nombres, encontrar a
 * alguien obligaba a recorrer la lista entera con la vista. Aquí se teclean dos
 * letras y listo.
 *
 * Se comporta como un "agregar", no como un campo: en cuanto eliges a alguien
 * se vacía y queda listo para el siguiente. Por eso `value` es siempre `null` y
 * el texto escrito se limpia a mano — si guardara la selección, el nombre se
 * quedaría escrito y habría que borrarlo antes de añadir a otro.
 */
export const PlayerPicker = ({
  players,
  onPick,
  placeholder = "Buscar y agregar jugador…",
  emptyLabel = "Ya agregaste a todos",
}: {
  readonly players: readonly PickablePlayer[];
  readonly onPick: (player: PickablePlayer) => void;
  readonly placeholder?: string;
  readonly emptyLabel?: string;
}) => {
  const [query, setQuery] = useState("");
  const disabled = players.length === 0;

  return (
    <Combobox
      disabled={disabled}
      inputValue={query}
      items={players as PickablePlayer[]}
      itemToStringLabel={(player: PickablePlayer) => player.name}
      onInputValueChange={setQuery}
      onValueChange={(picked: PickablePlayer | null) => {
        if (!picked) return;
        onPick(picked);
        setQuery("");
      }}
      value={null}
    >
      <ComboboxInput
        className="w-full"
        placeholder={disabled ? emptyLabel : placeholder}
      />
      <ComboboxContent>
        <ComboboxEmpty>Nadie con ese nombre</ComboboxEmpty>
        <ComboboxList>
          <ComboboxCollection>
            {(player: PickablePlayer) => (
              <ComboboxItem key={player.id} value={player}>
                <span className="truncate">{player.name}</span>
              </ComboboxItem>
            )}
          </ComboboxCollection>
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
};
