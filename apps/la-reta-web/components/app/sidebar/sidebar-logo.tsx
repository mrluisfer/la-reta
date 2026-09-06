import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import Image from "next/image";
import Link from "next/link";

/**
 * El logo usa `SidebarMenuButton size="lg"` en vez de una tarjeta con borde
 * propio: el primitivo ya sabe encogerse a 40 px en modo icono y alinea con el
 * resto del menú, mientras que la tarjeta tenía que deshacer su borde, su
 * padding y su sombra a golpe de `group-data-[collapsible=icon]:`.
 */
export const SidebarLogo = () => {
  const year = new Date().getFullYear();

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        size="lg"
        render={<Link href="/" aria-label="Ir al resumen" />}
        className="hover:bg-sidebar-accent/80 rounded-xl group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:rounded-2xl"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-black/8">
          <Image
            src="/fifa-wc.webp"
            alt=""
            width={1536}
            height={1024}
            sizes="28px"
            priority
            className="h-6 w-auto rounded-full"
          />
        </span>
        <div className="grid flex-1 leading-tight">
          <span className="truncate text-sm font-bold tracking-tight">
            La Reta
          </span>
          <span className="text-sidebar-foreground/60 truncate text-xs">
            Temporada FIFA {year}
          </span>
        </div>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
};
