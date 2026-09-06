import { CircleDotIcon } from "lucide-react";
import Link from "next/link";

/**
 * Antes era una tarjeta con borde de tres líneas encima de la navegación, así
 * que entre el logo y el primer enlace había dos cajas. Aquí cabe en una fila:
 * lo único que hay que saber es si hay partido, y si lo hay, cómo llegar.
 */
export const SidebarLiveStatus = ({
  liveActive,
}: {
  readonly liveActive: boolean;
}) => {
  if (!liveActive) {
    return (
      <p className="text-sidebar-foreground/50 flex h-8 items-center gap-2 px-2 text-xs group-data-[collapsible=icon]:hidden">
        <CircleDotIcon className="size-3.5" aria-hidden="true" />
        Sin partido activo
      </p>
    );
  }

  return (
    <Link
      href="/live"
      className="focus-visible:ring-sidebar-ring flex h-8 items-center gap-2 rounded-lg bg-emerald-500/12 px-2 text-xs font-semibold text-emerald-700 transition-colors group-data-[collapsible=icon]:hidden hover:bg-emerald-500/20 focus-visible:ring-2 focus-visible:outline-none dark:text-emerald-400"
    >
      <CircleDotIcon
        className="size-3.5 motion-safe:animate-pulse"
        aria-hidden="true"
      />
      Partido en juego
      <span className="ml-auto font-normal opacity-70">Ver marcador</span>
    </Link>
  );
};
