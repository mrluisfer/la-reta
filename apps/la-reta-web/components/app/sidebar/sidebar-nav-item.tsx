import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavItem } from "./types/nav-section";

/**
 * Punto sobre el icono cuando el sidebar está en modo icono: ahí se esconden
 * `SidebarMenuBadge` y la fila de estado del header, así que sin esto un
 * partido en vivo dejaba de anunciarse justo en la vista más compacta.
 */
const LiveDot = () => (
  <span
    aria-hidden="true"
    className="bg-sidebar absolute top-1 right-1 hidden size-3 items-center justify-center rounded-full group-data-[collapsible=icon]:flex"
  >
    <span className="size-1.5 rounded-full bg-emerald-500 motion-safe:animate-pulse" />
  </span>
);

const NavLink = ({
  item,
  active,
  liveActive,
}: {
  readonly item: NavItem;
  readonly active: boolean;
  readonly liveActive: boolean;
}) => {
  const showLive = item.href === "/live" && liveActive;

  return (
    <>
      <SidebarMenuButton
        isActive={active}
        // El primitivo ya oculta el tooltip salvo en modo icono
        // (`hidden={state !== "collapsed"}`), así que no hay que condicionarlo
        // desde fuera: hacerlo obligaba a suscribir el sidebar entero a
        // `useSidebar()` y re-renderizarlo en cada toggle.
        tooltip={item.hint ? `${item.title} · ${item.hint}` : item.title}
        render={<Link href={item.href} />}
        className={cn(
          "h-10 rounded-xl px-3 transition-all group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:rounded-2xl",
          "data-[active=true]:bg-sidebar-primary/12 data-[active=true]:text-sidebar-foreground data-[active=true]:shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--sidebar-primary)_28%,transparent)]",
          "hover:bg-sidebar-accent/80 hover:text-sidebar-foreground"
        )}
      >
        <item.icon className={cn(active && "text-sidebar-primary")} />
        <span>{item.title}</span>
      </SidebarMenuButton>
      {showLive ? (
        <>
          <SidebarMenuBadge className="right-2 bg-emerald-500/14 text-emerald-600 group-data-[collapsible=icon]:hidden dark:text-emerald-400">
            Live
          </SidebarMenuBadge>
          <LiveDot />
        </>
      ) : null}
    </>
  );
};

// Sin `React.memo` a propósito, aunque el React Compiler no esté activado: el
// componente lee `usePathname()`, así que una navegación lo vuelve a renderizar
// igual, y una navegación es lo único que cambia lo que pinta.
export const SidebarNavItem = ({
  item,
  active,
  liveActive,
  admin,
}: {
  readonly item: NavItem;
  readonly active: boolean;
  readonly liveActive: boolean;
  readonly admin: boolean;
}) => {
  const pathname = usePathname();

  if (item.onlyAdmin && !admin) {
    return null;
  }

  const subItems = item.subItems?.filter((sub) => admin || !sub.onlyAdmin);

  if (!subItems?.length) {
    return (
      <SidebarMenuItem>
        <NavLink item={item} active={active} liveActive={liveActive} />
      </SidebarMenuItem>
    );
  }

  const inBranch =
    pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    // `key` en vez de un efecto que sincronice `open` con la ruta: Base UI abre
    // por `defaultOpen` y solo lo relee al montar, así que cambiar la clave al
    // entrar o salir de la rama es lo que hace que "Jugadores" se despliegue
    // solo al llegar a /players/registro desde ⌘K.
    <Collapsible
      key={inBranch ? "in-branch" : "out-of-branch"}
      defaultOpen={inBranch}
      render={<SidebarMenuItem />}
    >
      <NavLink item={item} active={active} liveActive={liveActive} />
      <CollapsibleTrigger
        // Explícito, igual que en `combobox.tsx`: el trigger deduce
        // `nativeButton={false}` por venir con `render`, pero `SidebarMenuAction`
        // sí monta un <button> nativo y Base UI avisa en consola.
        nativeButton
        render={
          <SidebarMenuAction
            aria-label={`Mostrar u ocultar las páginas de ${item.title}`}
            className="group/sub-toggle top-2.5 right-2 rounded-lg"
          />
        }
      >
        <ChevronRightIcon className="transition-transform duration-200 group-data-[panel-open]/sub-toggle:rotate-90" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <SidebarMenuSub className="border-sidebar-border/70 mt-1 ml-4 gap-0.5">
          {subItems.map((subItem) => {
            const subActive = pathname === subItem.href;

            return (
              <SidebarMenuSubItem key={subItem.href}>
                <SidebarMenuSubButton
                  isActive={subActive}
                  render={<Link href={subItem.href} />}
                  className="data-[active=true]:bg-sidebar-primary/10 data-[active=true]:text-sidebar-foreground h-8 rounded-lg"
                >
                  {subItem.icon ? (
                    <subItem.icon
                      className={cn(subActive && "text-sidebar-primary")}
                    />
                  ) : null}
                  <span>{subItem.title}</span>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            );
          })}
        </SidebarMenuSub>
      </CollapsibleContent>
    </Collapsible>
  );
};
