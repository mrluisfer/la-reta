import Image from "next/image";
import Link from "next/link";
import { SidebarTitle } from "../sidebar-title";

export const SidebarLogo = () => {
  const year = new Date().getFullYear();

  return (
    <Link
      href="/"
      aria-label="Ir al resumen"
      className="border-sidebar-border/70 bg-sidebar/80 group-data-[collapsible=icon]:border-sidebar-border/60 hover:bg-muted block rounded-xl border p-3 shadow-sm transition-colors group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:shadow-none"
    >
      <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-4xl bg-white shadow-sm ring-1 ring-black/8 group-data-[collapsible=icon]:h-11 group-data-[collapsible=icon]:w-11 group-data-[collapsible=icon]:rounded-4xl">
          <Image
            src="/fifa-wc.webp"
            alt="Reta Credix · FIFA 26"
            width={1536}
            height={1024}
            sizes="28px"
            priority
            className="h-7 w-auto rounded-full"
          />
        </div>
        <div className="min-w-0 group-data-[collapsible=icon]:hidden">
          <div className="flex items-center gap-2">
            <SidebarTitle />
            <span className="bg-sidebar-accent text-sidebar-accent-foreground rounded-full px-2 py-0.5 text-xs font-semibold">
              FIFA {year}
            </span>
          </div>
          <p className="text-sidebar-foreground/65 mt-1 text-xs">
            Navegación principal de la reta
          </p>
        </div>
      </div>
    </Link>
  );
};
