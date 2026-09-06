import { AppSidebar } from "@/components/app/sidebar/app-sidebar";
import { LegalConsentGate } from "@/components/features/legal/legal-consent-alert";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { isAdmin } from "@/lib/admin";
import { cookies } from "next/headers";
import { AppSidebarHeader } from "./sidebar/app-sidebar-header";

/**
 * `SidebarProvider` escribe `sidebar_state` al togglear, pero su estado inicial
 * es `defaultOpen` y nunca lee la cookie: sin esto, colapsar el sidebar duraba
 * hasta la siguiente recarga. Se lee aquí porque el layout ya es dinámico
 * (`isAdmin()` también toca cookies), así que no cuesta nada.
 */
export const AppShell = async ({
  children,
}: {
  readonly children: React.ReactNode;
}) => {
  const [admin, cookieStore] = await Promise.all([isAdmin(), cookies()]);
  const sidebarOpen = cookieStore.get("sidebar_state")?.value !== "false";

  return (
    <SidebarProvider defaultOpen={sidebarOpen}>
      {/* Primer tabulador de la página: salta el sidebar completo (14+ enlaces)
          y aterriza en el contenido. Invisible hasta que recibe foco. */}
      <a
        href="#contenido"
        className="bg-primary text-primary-foreground focus-visible:ring-ring focus-visible:ring-offset-background sr-only rounded-md px-4 py-2 text-sm font-semibold focus-visible:not-sr-only focus-visible:fixed focus-visible:top-3 focus-visible:left-3 focus-visible:z-50 focus-visible:ring-2 focus-visible:ring-offset-2"
      >
        Saltar al contenido
      </a>
      <AppSidebar admin={admin} />
      {/* min-w-0: deja que el inset encoja junto al sidebar acoplado; sin esto,
          contenido ancho fuerza scroll horizontal en tablet. */}
      <SidebarInset className="min-w-0">
        <AppSidebarHeader />
        <main id="contenido" className="min-w-0 flex-1 p-4 md:p-6">
          <LegalConsentGate>{children}</LegalConsentGate>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};
