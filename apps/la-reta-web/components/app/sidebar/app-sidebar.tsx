"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarRail,
} from "@/components/ui/sidebar";
import { liveMatchAtom } from "@/lib/state/atoms";
import { atom, useAtomValue } from "jotai";
import { SparkleIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import * as React from "react";
import { Badge } from "../../ui/badge";
import { ADMIN_ITEMS } from "./constants/admin-items";
import { NAV_SECTIONS } from "./constants/nav-sections";
import { NON_ADMIN_ITEMS } from "./constants/non-admin-items";
import { NavUser } from "./nav-user";
import { SidebarLiveStatus } from "./sidebar-live-status";
import { SidebarLogo } from "./sidebar-logo";
import { SidebarNavItem } from "./sidebar-nav-item";
import { SidebarSearch } from "./sidebar-search";

const ALL_NAV_ITEMS = NAV_SECTIONS.flatMap((section) => section.items);
const liveMatchActiveAtom = atom((get) => get(liveMatchAtom).active);

export const AppSidebar = ({ admin }: { readonly admin: boolean }) => {
  const pathname = usePathname();
  const liveActive = useAtomValue(liveMatchActiveAtom);

  // El React Compiler no está activado en este proyecto (no hay `reactCompiler`
  // en next.config.ts), así que este useMemo sí evita recorrer todos los items
  // de navegación en cada render.
  // eslint-disable-next-line react-doctor/react-compiler-no-manual-memoization
  const activeHref = React.useMemo(
    () =>
      [...ALL_NAV_ITEMS, ...(admin ? ADMIN_ITEMS : NON_ADMIN_ITEMS)].reduce<
        string | null
      >((bestHref, item) => {
        if (item.href === "/") {
          return pathname === "/" ? "/" : bestHref;
        }

        const matches =
          pathname === item.href || pathname.startsWith(item.href + "/");

        if (!matches) return bestHref;

        if (!bestHref || item.href.length > bestHref.length) {
          return item.href;
        }

        return bestHref;
      }, null),
    [pathname, admin]
  );

  const sections = [
    ...NAV_SECTIONS,
    { label: "Administración", items: admin ? ADMIN_ITEMS : NON_ADMIN_ITEMS },
  ];

  return (
    <Sidebar
      variant="floating"
      collapsible="icon"
      // Igual que el header: queda fijo mientras el contenido se desliza.
      style={{ viewTransitionName: "app-sidebar" }}
    >
      <SidebarHeader className="gap-2 group-data-[collapsible=icon]:px-1 group-data-[collapsible=icon]:pt-3">
        <SidebarMenu>
          <SidebarLogo />
        </SidebarMenu>
        <SidebarSearch admin={admin} />
        <SidebarLiveStatus liveActive={liveActive} />
      </SidebarHeader>

      <SidebarContent className="gap-1 group-data-[collapsible=icon]:px-1">
        {sections.map((section) => (
          <SidebarGroup
            key={section.label}
            className="px-2 py-1 group-data-[collapsible=icon]:px-0"
          >
            {/* El primitivo ya funde el label en modo icono (`-mt-8 opacity-0`
                con transición). Condicionarlo desde JS obligaba a suscribir el
                sidebar a `useSidebar()` y lo hacía desaparecer de golpe. */}
            <SidebarGroupLabel className="text-sidebar-foreground/45 px-2 text-xs font-semibold tracking-[0.14em] uppercase">
              {section.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="group-data-[collapsible=icon]:items-center">
                {section.items.map((item) => (
                  <SidebarNavItem
                    key={item.href}
                    item={item}
                    active={item.href === activeHref}
                    liveActive={liveActive}
                    admin={admin}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="gap-2 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-1">
        <SidebarMenu>
          <NavUser />
        </SidebarMenu>
        <Badge
          variant="outline"
          className="group-data-[collapsible=icon]:hidden"
        >
          <SparkleIcon className="text-sidebar-primary size-3.5" /> Beta v1.1.0
        </Badge>
      </SidebarFooter>

      {/* El borde del sidebar como asa: sin esto el único modo de colapsarlo era
          el botón del header o ⌘B, que nadie descubre. El sr-only del primitivo
          está en inglés; el resto de la app es es-MX. */}
      <SidebarRail
        aria-label="Mostrar u ocultar el menú"
        title="Mostrar u ocultar el menú"
      />
    </Sidebar>
  );
};
