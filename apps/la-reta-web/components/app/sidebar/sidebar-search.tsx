"use client";

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Kbd } from "@/components/ui/kbd";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { ADMIN_ITEMS } from "./constants/admin-items";
import { NAV_SECTIONS } from "./constants/nav-sections";
import { NON_ADMIN_ITEMS } from "./constants/non-admin-items";
import { NavItem } from "./types/nav-section";

type Entry = { item: NavItem; parent?: string };

/**
 * Agrupa secciones y subsecciones por etiqueta. El sidebar tiene 14+ enlaces y
 * hasta dos niveles: buscar es más rápido que recorrerlo, y el propio skip-link
 * de `AppShell` existe porque recorrerlo con teclado es largo.
 */
const groupDestinations = (admin: boolean) => {
  const grouped = new Map<string, Entry[]>();
  const sections = [
    ...NAV_SECTIONS,
    { label: "Administración", items: admin ? ADMIN_ITEMS : NON_ADMIN_ITEMS },
  ];

  for (const section of sections) {
    const entries: Entry[] = [];

    for (const item of section.items) {
      if (item.onlyAdmin && !admin) continue;

      entries.push({ item });

      for (const sub of item.subItems ?? []) {
        if (sub.onlyAdmin && !admin) continue;
        entries.push({ item: sub, parent: item.title });
      }
    }

    if (entries.length) {
      grouped.set(section.label, entries);
    }
  }

  return grouped;
};

export const SidebarSearch = ({ admin }: { readonly admin: boolean }) => {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const grouped = groupDestinations(admin);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((previous) => !previous);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            onClick={() => setOpen(true)}
            tooltip="Buscar en el menú · ⌘K"
            className="border-sidebar-border/70 bg-sidebar-accent/35 text-sidebar-foreground/70 hover:bg-sidebar-accent/70 h-9 rounded-xl border px-3 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-2xl group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:px-0!"
          >
            <SearchIcon />
            <span className="group-data-[collapsible=icon]:hidden">
              Buscar…
            </span>
            {/* En el sheet de móvil no hay teclado que enseñar: el sidebar
                acoplado solo existe a partir de `md`. */}
            <Kbd className="ml-auto group-data-[collapsible=icon]:hidden max-md:hidden">
              ⌘K
            </Kbd>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Buscar en el menú"
        description="Escribe para filtrar las páginas de la reta."
      >
        {/* El `CommandDialog` de este repo no envuelve a sus hijos en
            `<Command>` como el de shadcn: sin esto, `CommandInput` se queda sin
            el store de cmdk y revienta al montar. */}
        <Command>
          {/* `autoFocus` explícito: el popup de Base UI no lleva el foco al
              primer elemento tabulable, y sin esto ⌘K abría el diálogo pero
              había que ir al ratón para poder escribir. */}
          <CommandInput autoFocus placeholder="Buscar una página…" />
          <CommandList>
            <CommandEmpty>Sin resultados.</CommandEmpty>
            {[...grouped].map(([section, entries]) => (
              <CommandGroup key={section} heading={section}>
                {entries.map(({ item, parent }) => (
                  <CommandItem
                    key={item.href}
                    value={`${parent ?? ""} ${item.title} ${item.hint ?? ""}`}
                    onSelect={() => go(item.href)}
                  >
                    <item.icon className="text-muted-foreground" />
                    <span>
                      {parent ? `${parent} · ` : ""}
                      {item.title}
                    </span>
                    {item.hint ? (
                      <span className="text-muted-foreground ml-auto text-xs">
                        {item.hint}
                      </span>
                    ) : null}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
};
