"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useClerk, useUser } from "@clerk/nextjs";
import { ChevronsUpDownIcon, LogOutIcon, UserRoundCogIcon } from "lucide-react";

const initials = (name: string) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

/**
 * La sesión iniciada vive en el pie del sidebar; el header solo conserva los
 * CTA de "iniciar sesión"/"crear cuenta", que sí tienen que verse antes de
 * abrir nada. No se pinta un esqueleto mientras Clerk carga: en la mayoría de
 * visitas no hay sesión y el hueco se quedaría anunciando una cuenta que no
 * existe.
 */
export const NavUser = () => {
  const { user, isLoaded } = useUser();
  const { openUserProfile, signOut } = useClerk();
  const { isMobile } = useSidebar();

  if (!(isLoaded && user)) {
    return null;
  }

  const name = user.fullName ?? user.username ?? "Mi cuenta";
  const email = user.primaryEmailAddress?.emailAddress;

  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <SidebarMenuButton
              size="lg"
              tooltip={name}
              className="hover:bg-sidebar-accent/80 rounded-xl group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:rounded-2xl"
            />
          }
        >
          <Avatar className="size-8 rounded-lg">
            {user.imageUrl ? <AvatarImage src={user.imageUrl} alt="" /> : null}
            <AvatarFallback className="rounded-lg">
              {initials(name)}
            </AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left leading-tight">
            <span className="truncate text-sm font-semibold">{name}</span>
            {email ? (
              <span className="text-sidebar-foreground/60 truncate text-xs">
                {email}
              </span>
            ) : null}
          </div>
          <ChevronsUpDownIcon className="ml-auto size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-56 rounded-xl"
          side={isMobile ? "top" : "right"}
          align="end"
          sideOffset={8}
        >
          <DropdownMenuLabel className="font-normal">
            <span className="block truncate text-sm font-semibold">{name}</span>
            {email ? (
              <span className="text-muted-foreground block truncate text-xs">
                {email}
              </span>
            ) : null}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => openUserProfile()}>
            <UserRoundCogIcon />
            Administrar cuenta
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => signOut({ redirectUrl: "/" })}>
            <LogOutIcon />
            Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
};
