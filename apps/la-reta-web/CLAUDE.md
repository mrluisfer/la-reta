# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

**Before writing any Next.js code, read the relevant guide in `node_modules/next/dist/docs/`** (per AGENTS.md above — this is Next 16.2.9 and APIs differ from training data). Real deltas noted in those docs: `unstable_instant` for instant navigation, `refresh()` from `next/cache`.

**Before writing/customizing Base UI (`@base-ui/react`) code, consult `docs/base-ui-llms.txt`** — an index of the official docs (`base-ui.com/react/**.md`). Find the relevant component/handbook page and `WebFetch` its `.md` URL before coding; the `render` prop, `nativeButton`, and slot composition differ from memory.

**Skills:** This session ships Vercel (`vercel:*`) and Neon (`neon`, `neon-postgres`) skills. Prefer them over memorized APIs for anything touching Vercel deploys/env or Neon Postgres.

## Commands

```bash
npm run dev          # dev server
npm run build        # production build (source of truth for CSS — dev can serve stale @theme)
npm run lint         # eslint
npm run format       # prettier --write .
npm run db:push      # sync Drizzle schema → Neon
npm run db:seed      # tsx lib/db/seed.ts (see warning below)
npm run db:studio    # Drizzle Studio
npm run db:generate  # generate migration files
```

No test runner is configured.

## Environment

Secrets live in **`.env`** (gitignored), not `.env.local`. Next loads `.env` on its own; `drizzle.config.ts` and `lib/db/seed.ts` load both via dotenv with `.env.local` winning. Neon `DATABASE_URL` is already in `.env`. Admin PIN in `ADMIN_PIN` (default `reta2026`), live PIN in `LIVE_PIN` (default `gol2026`). Auth via Clerk (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`). Image uploads via Vercel Blob (`BLOB_READ_WRITE_TOKEN`) — the store must be **public** (photos are served by URL); env is read from `.env`, so after `vercel env pull` copy the token there too.

## Data safety (hard rule)

**Una migración en `drizzle/` no está aplicada por estar escrita.** `0009_signup_clerk_user.sql` llevaba meses sin correr y `player_signups.clerk_user_id` no existía en Neon: como Drizzle enumera **todas** las columnas declaradas en el `SELECT`, eso tiraba `getPlayerSignups()` entero — `/admin/registros` en 500 y nadie podía apuntarse ni desde la web ni desde la app. No lo ves compilando ni en los tipos; solo contra la base. Para comprobar la deriva, cruza `information_schema.columns` con `getTableConfig()` de cada `PgTable` de `lib/db/schema.ts`.

`db:seed` deletes `players` (cascades to everything FK'd to a player: `match_goals`, `casaca_assignments`, `player_stat_history`, `player_comments`, `generated_reta_players`) but NOT `matches`/`ideas`/`reta_words` — re-seeding accumulates those. **Do not re-seed or run DML against real data.** Schema changes must be additive (new migrations in `drizzle/`, `db:push`); never rewrite seeded/user rows.

## Deploy (Vercel)

El proyecto de Vercel apunta a **Root Directory = `apps/la-reta-web`**, no a la raíz del repo. Es un ajuste del dashboard (la API es `PATCH /v9/projects/<id>` con `rootDirectory`); no se puede fijar desde `vercel.json`, que es lo único que se lee _desde_ ese directorio. Con la raíz mal puesta el build pasa pero el deploy muere con «The Next.js output directory ".next" was not found», porque turbo deja el `.next` dentro de la app y Vercel lo busca arriba.

Lo demás sí vive en el repo, en `vercel.json`, y **gana sobre los overrides del dashboard**: framework y `npx turbo run build --filter=la-reta-web` (turbo se encuentra la raíz solo desde el workspace). Install y Output Directory van en blanco a propósito: el default de Vercel ya instala el workspace completo desde la raíz.

## Architecture

FIFA-style dashboard for organizing pickup football ("la reta"). **Next 16 App Router + Server Components/Actions · Drizzle ORM + Neon serverless Postgres · Clerk auth · Vercel Blob uploads · Jotai · TanStack Query (one flow only) · shadcn/ui + Base UI (`base-lyra`) · Tailwind v4.**

- **DB client** (`lib/db/index.ts`): `db` is a lazy `Proxy` — the Neon connection is created on first query so `next build` needs no env at module eval. Any page reading the DB must set `export const dynamic = "force-dynamic"`.
- **Ratings** (`lib/ratings.ts`): overall is a position-group-weighted (GK/DEF/MID/FWD) average of the 6 attributes (PAC/SHO/PAS/DRI/DEF/PHY); card tier (bronze/silver/gold/special) derives from overall. Server Actions in `app/actions/players.ts` **recompute overall on every save**.
- **Positions**: players have `position` + nullable `position2`; helper `playerPositions()` in `lib/format.ts`. `lib/team-balancer.ts` builds even teams (one GK-capable per side, shuffled for variety) returning `Lineup[]` with the role played — overall still uses the primary position.
- **N equipos** (default 2, hasta 6): las letras viven en `lib/teams.ts` (`TEAM_KEYS`, colores, `teamName()`). `balanceTeams(players, teamCount)` devuelve `{ teams: TeamSplit[], diff }` (`diff` = spread max−min) y afina el greedy con una búsqueda local (`refine`). La reta guarda sus N equipos en `generated_retas.teams` (jsonb); las filas viejas se reconstruyen con `retaTeams()` en `lib/queries.ts`. Una reta de 3+ equipos se registra como **un solo partido con marcador de N equipos**: `matches.teams` (jsonb) trae `{key,name,score}` por equipo y `match_goals.team` guarda la letra real (A…F). Los dos primeros equipos se copian siempre a `team_a_name`/`score_a` y su par B, así que todo lo viejo sigue leyendo. Helper `matchTeams()` en `lib/teams.ts` (client-safe) — úsalo en vez de `scoreA`/`scoreB` en cualquier vista nueva. `RetaMatchForm` es el **único** formulario de partidos (alta en `/matches`, edición en `/matches/[id]/edit`; `MatchForm` ya no existe): arma la reta a mano o prellena desde una generada, con una tarjeta por equipo donde se agregan jugadores del roster e invitados. El select de roster filtra **por equipo**, no global — alguien puede jugar en varios equipos y sus goles se guardan por separado en cada uno. Los goleadores sin equipo (partidos viejos) salen en una tarjeta aparte para asignarlos. Guardar es admin-only en la UI (`createMatch`/`updateMatch` no checan sesión: `/live` los llama con el PIN de live). `updateMatch` conserva `teams` cuando la forma de edición (de 2 lados) no lo manda. `resetTeamsOnEditAtom` (switch "Reiniciar al editar", **off** por default) hace que agregar/editar/quitar convocados no tire el tablero: quien entra queda "por asignar" y se le da equipo a mano o con "Repartir" (`addToTeam`/`removeFromTeams`/`replacePlayer`/`lightestTeam` en `lib/team-balancer.ts`).
- **Server Actions** live in `app/actions/*.ts`, one file per domain (players, matches, ideas, words, comments, reports, legal, admin, casacas, retas, uploads, player-signups). Prefer RSC + Server Actions; **TanStack Query is used ONLY in the players gallery** (`hooks/use-players.ts` + `GET /api/players`, seeded with server `initialData`).
- **State**: Jotai atoms in `lib/state/atoms.ts`. Live match (`/live`) uses `liveMatchAtom` (`atomWithStorage`, clave `reta:live-match-v2`) — lleva los equipos de la reta y todos sus goles; "Finalizar" llama `createMatch` una sola vez (ver «El marcador en vivo» más abajo). Nombres y número de equipos se comparten con /teams (`teamNamesAtom`, `teamCountAtom`). Team builder selection + last-minute guests are also Jotai/localStorage.
- **Schema** (`lib/db/schema.ts`): `players`, `player_stat_history`, `player_comments`, `comment_reactions`, `matches`, `match_goals`, `generated_retas`, `generated_reta_players`, `ideas`, `reta_words`, `legal_acceptances`, `reports`, `player_signups`, `casaca_assignments`. `getTopScorers` aggregates goals across `match_goals`.
- **Auth**: Clerk (`@clerk/nextjs`). `middleware.ts` runs `clerkMiddleware()` — no route gating yet, it just exposes the session so `auth()` / `currentUser()` work anywhere. Sign-in/up at `/sign-in`, `/sign-up`. This is **separate** from the admin PIN cookie.
- **Admin**: `/admin*` gated by PIN cookie `reta_admin` — see `lib/admin.ts` `isAdmin()`. Admin-only UI (kebab actions, etc.) is conditionally rendered. Sensitive actions allow `isAdmin()` **or** a signed-in Clerk user.
- **Image uploads**: Vercel Blob (`@vercel/blob`). Todo lo que sube por servidor pasa por **`lib/images.ts` `toWebp()`** (sharp: `rotate()` EXIF → `fit:"inside"` sin agrandar → WebP q80, `animated:true`; self-check `npx tsx lib/images.ts`), así que en el store siempre hay WebP ≤1600 px sin deformar. Server action `app/actions/uploads.ts` (`put`, `access:"public"`, `contentType` de `toWebp`) más un client-upload flow (`components/ImageUploader.tsx` → `app/api/blob/upload/route.ts`) donde el navegador sube **directo** a Blob: ahí el servidor nunca ve los bytes, así que la garantía es el token (`allowedContentTypes: image/webp` + 500 KB), no sharp. Store must be **public**. `lib/queries.ts` overlays a local `public/players/<id>` image over `photoUrl` when present.
- **Casacas** (`/casacas`): a from-scratch SVG wheel (`components/features/casacas/wheel.tsx`) that randomly picks who washes the bibs. Pure logic in `lib/casacas.ts` (excludes the last 2 winners; self-check via `npx tsx lib/casacas.ts`). Persisted in `casaca_assignments` (roster `playerId` **or** guest `guestName`). Logic lives in the `useCasacaWheel` hook; UI split into `wheel-panel` / `casaca-history` / `winner-dialog`.

### API pública (`/api/v1`)

**La app nativa no habla con la base: habla con estas rutas.** Cualquier cambio aquí es un cambio de contrato con un cliente que se despliega aparte y puede tardar días en actualizarse, así que **se añade, no se rompe**: campo nuevo sí, campo renombrado no.

- Toda ruta usa los helpers de `lib/api/respond.ts` — `handler()` envuelve para que un fallo salga como JSON y no como el HTML de error de Next (que un cliente móvil no sabe leer), `jsonOk`/`jsonError` responden, y `preflight` se re-exporta como `OPTIONS` para el CORS de Expo web. Todas van `force-dynamic`.
- **Quién pide** lo resuelve `getActor()` (`lib/api/context.ts`): `auth()` de Clerk lee igual la cookie de la web que el `Authorization: Bearer` del móvil, así que el `userId` sale del mismo sitio en los dos. El gate de PIN viaja en `x-reta-pin-token` porque `Authorization` ya está ocupado y en el teléfono no hay cookie httpOnly que valga.
- **Quién es el sujeto lo dice el token, nunca el cuerpo.** Reclamar una ficha, firmar un comentario o apuntar un turno de casacas sacan la identidad de la sesión; el cuerpo solo trae el objeto.
- Las rutas envuelven las mismas server actions que usa la web (`app/actions/*`) siempre que exista una. Cuando no —editar el comentario propio— la lógica vive en la ruta y queda anotado ahí por qué.

| Ruta | Métodos |
| --- | --- |
| `/players`, `/players/[id]` | GET · PATCH (dueño o admin, nunca los atributos) |
| `/players/[id]/profile` | GET — historial de atributos, premios, casacas y reseñas en una consulta |
| `/players/[id]/comments`, `/[commentId]` | POST · PATCH (solo el propio, filtrado por `author_id` en el mismo UPDATE) |
| `/players/[id]/claim`, `/players/me` | POST · GET — vinculación cuenta ↔ ficha |
| `/matches`, `/matches/[id]/votes` | GET · POST · DELETE |
| `/retas`, `/retas/[id]` | GET · POST (pide cuenta: ese historial es la memoria del repartidor) |
| `/casacas` | GET · POST |
| `/player-signups`, `/uploads`, `/avatar`, `/auth/pin`, `/reta-words` | — |

`/avatar` recorta a círculo con sharp y **no pide sesión** a propósito: el cargador de imágenes nativo no manda cabeceras. Su `ALLOWED_HOSTS` es la defensa — solo hosts de Clerk.

### UI conventions

- Display font is **Oswald** via `next/font` (`--font-oswald`). Tailwind v4 did NOT generate `font-display` from the `@theme` token — it's hand-defined in `app/globals.css` (`@layer utilities`). Use `font-display`.
- `components/ui/button.tsx` is modified: when `render` is passed (e.g. `<Button render={<Link/>}>`) it sets `nativeButton={false}` to avoid a Base UI warning. Keep this if regenerating.
- `components/ui/collapsible.tsx` is modified, igual que `button.tsx`: `CollapsibleTrigger` deriva `nativeButton` de si le pasas `render` (p. ej. `render={<CardHeader/>}`), porque si no Base UI avisa en consola y el `<div>` resultante se queda sin role/tabIndex/teclado. Keep this if regenerating.
- `components/ui/combobox.tsx` is modified: el `InputGroupButton` que envuelve al `ComboboxTrigger` lleva `nativeButton` explícito. Sin él nuestro `Button` deduce `nativeButton={false}` por venir con `render`, pero el trigger de Base UI **sí** monta un `<button>` nativo y la consola se llena de avisos. Keep this if regenerating.
- `components/ui/alert-dialog.tsx` is modified: `AlertDialogAction` es un `AlertDialogPrimitive.Close` con `render={<Button/>}`, no un `<Button>` suelto como lo genera shadcn. Con el original, confirmar ejecutaba la acción y **dejaba el diálogo abierto**; había que cerrarlo a mano y ese clic de más caía en lo que hubiera debajo (p. ej. cerraba el panel plegable de `/matches`). Keep this if regenerating.
- `components/ui/alert.tsx` is modified: `AlertAction` fluye debajo del texto en vez de flotar en la esquina (`absolute top-2.5 right-3` + `pr-18` en el Alert), porque un par de botones normales se montaban sobre la descripción. Keep this if regenerating.
- Component layout: `components/ui/*` (shadcn primitives), `components/app/*` (shell/sidebar/providers), `components/features/<domain>/*`, `components/shared/*` (fifa-card, pitch, page-header, section-heading).
- **Reusable page chrome**: every view's header is `<PageHeader title description actions />` (`components/shared/page-header.tsx`); section separators with the accent bar are `<SectionHeading title count? tone? />` (`components/shared/section-heading.tsx`, tones `primary`/`emerald`/`muted`). Reach for these instead of re-inlining an `h1`/`h2`.
- **Confirmaciones destructivas**: `<ConfirmDialog trigger title description onConfirm pending />` (`components/shared/confirm-dialog.tsx`) envuelve el `AlertDialog` de la app. Nada de `confirm()` nativo — se ve fuera de lugar, bloquea el hilo y solo admite una línea de texto.
- **Prefer shadcn primitives over bespoke containers**: cards/panels use `Card`/`CardContent` (theme radius is `rounded-xl`; use `size="sm"` for compact density), empty states use `Empty`. Don't hand-roll `bg-card ring rounded-lg` boxes.

#### El marcador en vivo (`/live`)

`components/features/live/live-match/*`. Es la única vista que se usa **de pie, con una mano y mirando la cancha**, así que aquí lo móvil no es el caso degradado sino el principal.

- **No hay duelo ni rotación: hay una reta con N equipos acumulando goles.** El estado (`liveMatchAtom`) es `{ active, teams, startedAt, goals }` y la pantalla enseña un botón de gol por equipo, todos a la vez. Hubo un `home`/`away`/`queue` con "gana y se queda" y un botón **Guardar y siguiente** que cerraba un partido en cada cambio de pareja: el registro acababa con ocho filas de cero minutos y marcadores 0-0 que no eran partidos de nada. Lo que de verdad se guarda de una reta son los goles de cada quien, y para eso da igual quién se enfrentaba a quién. `lib/live-rotation.ts` se borró con esto.
- **Se cierra UNA vez, con `createMatch` y los N equipos**: `teams: [{key,name,score}]` más los dos primeros copiados a `teamAName`/`scoreA` y su par B, porque `createMatch` solo mira `teams` a partir de tres equipos. **`scorers[].team` va con la letra real (A…F)**, no con un "A"/"B" según quién fuera local — eso último atribuía al lado equivocado los goles de una reta de 3+.
- **El marcador sigue el tema, no es una tarjeta negra fija.** Era `bg-neutral-950` con textos `white/xx`, así que en claro quedaba un agujero oscuro en medio de la pantalla. Ahora sale de tokens (`bg-card`, `text-foreground`, `divide-border`) y cada fila recibe los dos tonos de su equipo (`--team` el 500, `--team-light` el 400); `globals.css` (`.live-team-row`) resuelve una sola variable `--team-ink` por tema. **En claro el 500 no basta**: sobre blanco el verde y el ámbar se quedan en ~2:1, así que se oscurece con `color-mix(… 72%, black)` — medido, los seis quedan entre 4.9 y 8.2:1. No hay una tercera tabla de colores a mano justamente para que no se desincronice con `TEAM_COLORS`.
- **La clave de localStorage sigue siendo `reta:live-match-v2`** aunque el tipo perdiera tres campos: una reta guardada por la versión con rotación conserva `teams`, `startedAt` y `goals`, que es todo lo que se lee, y los sobrantes se ignoran solos. Subirla a `-v3` habría tirado el marcador de quien tuviera una reta a medias. Verificado cargando un estado con `home`/`away`/`queue`.

- **`LivePlayer` lleva foto, posición y overall, no solo el nombre** (`types.ts`, lo arma `app/live/page.tsx`). Es lo que hace reconocible a alguien en el selector de goleador: con veinte nombres, media plantilla llamándose parecido y un invitado de por medio, el nombre suelto no identifica a nadie. No mandes el `Player` entero — cruzarían al cliente los seis atributos de toda la plantilla para pintar una lista.
- **`searchKey()` (`live-match-utils.ts`) normaliza acentos y mayúsculas.** Nadie teclea "Álvarez" con tilde en el teléfono; sin esto la búsqueda parece rota. Se busca por nombre **y** por apodo (`displayName`).
- **El drawer del selector se estructura en tres bandas flex**: cabecera fija (chip de equipo + buscador), lista `min-h-0 flex-1 overflow-y-auto` y pie fijo. **`min-h-0` no es opcional**: sin él la lista empuja al popup y el botón de "No sé quién fue" se sale de la pantalla, que es justo el que nunca puede faltar — en la cancha lo normal es que nadie viera quién la metió, y obligar a inventar un nombre ensucia las estadísticas.
- **Las líneas van de delantero a portero, al revés que en la plantilla.** Aquí la pregunta no es cómo se alinea el equipo sino quién la metió: con los delanteros al final había que recorrer la lista entera en la respuesta más probable. Quien ya anotó se marca con borde discontinuo esmeralda y un contador, **en toda la lista y no solo en la sección «Ya anotaron»** — es dentro de su línea donde se le busca cuando repite.
- **Nada de `backdrop-filter` en un `sticky` dentro de un scroller.** Los encabezados de línea del selector lo llevaban (`backdrop-blur-sm`) y Chrome dejaba media lista sin pintar al recorrerla: tarjetas fantasma con solo el círculo del avatar, justo debajo de cada encabezado. El popup del drawer vive con `will-change: transform`, detrás corre el marcador animándose sin parar y el overlay del primitivo ya trae su propio `backdrop-filter`; con otro más dentro del scroller, la invalidación se pierde. Fondo opaco y listo. La lista lleva además `contain: paint` para acotar la región que se repinta.
- **Un `hover:` común no puede pisar el color de un estado.** Las filas compartían `hover:bg-accent`; sobre una fila de goleador eso le apagaba el verde a gris y se lo devolvía al salir, y se leía como un parpadeo. El hover de una fila con estado **intensifica su propio tinte** (`/10` → `/20`), no lo sustituye.
- **En Tailwind v4, `scale-*` emite la propiedad `scale`, no `transform`.** Un `transition-[…,transform]` junto a un `active:scale-*` no transiciona nada y encima promueve capas de balde: hay que listar `scale`.
- **Para verdes de estado, emerald explícito y no `--primary`.** En tema oscuro `--primary` es `#005f46`: un contador `text-primary` se quedaba en 2.3:1. La pareja `emerald-600 / dark:emerald-400` da 3.65 y 4.85 en el borde, y 5.36 y 11.64 en el número.
- **Para medir contraste por tema, pon la clase `light` o `dark` explícita en `<html>`.** El tema por defecto es "system" y el `<html>` va **sin clase**: quitar `dark` no deja la página en claro, la deja en lo que diga el sistema operativo, y las medidas salen del tema equivocado sin que nada avise.
- **El buscador solo se autoenfoca con puntero fino** (`matchMedia("(hover: hover) and (pointer: fine)")`). En el teléfono, enfocar al abrir levanta el teclado y tapa media lista justo cuando lo que quieres es reconocer una cara.
- Un gol sin dueño se pinta en ámbar en el marcador y en el registro, y la fila entera es el botón para asignarlo: es un objetivo táctil del ancho de la pantalla, no un nombre de 90 px.

#### El sidebar

`components/app/sidebar/*`. `AppSidebar` compone: `SidebarLogo` (un `SidebarMenuButton size="lg"`, no una tarjeta propia — el primitivo ya sabe encogerse a icono), `SidebarSearch` (⌘K), `SidebarLiveStatus`, un `SidebarNavItem` por entrada de `constants/nav-sections.ts` y `constants/admin-items.ts`, `NavUser` en el pie y `SidebarRail`. Añadir una ruta al menú es tocar solo los `constants/`: el buscador, el resaltado de activo y los submenús salen de ahí.

- **El estado plegado lo lee `AppShell` de la cookie `sidebar_state`** y lo pasa como `defaultOpen`. `SidebarProvider` escribe esa cookie pero nunca la lee; sin esto, plegar el sidebar duraba hasta la siguiente recarga.
- **No suscribas `AppSidebar` a `useSidebar()`.** Todo lo que cambia al plegar ya lo hace el CSS del primitivo: `SidebarGroupLabel` se funde solo (`group-data-[collapsible=icon]:-mt-8 opacity-0`) y el tooltip de `SidebarMenuButton` lleva `hidden={state !== "collapsed"}`. Condicionarlo desde JS re-renderizaba el sidebar entero en cada toggle y hacía que los labels desaparecieran de golpe.
- **Los submenús son `Collapsible`, y el trigger es un `SidebarMenuAction` aparte**, no el botón principal: la entrada padre (`/players`, `/teams`) es una página de verdad y tiene que seguir siendo un enlace. `CollapsibleTrigger` necesita **`nativeButton` explícito** ahí, igual que en `combobox.tsx` — sin él deduce `false` por venir con `render` y Base UI llena la consola. Base UI marca el estado con `data-panel-open` **en el trigger**, no con `data-state=open` como Radix: los ejemplos de shadcn que verás por ahí no aplican.
- **La rama abierta se sincroniza con la ruta por `key`, no por efecto.** `Collapsible` de Base UI solo lee `defaultOpen` al montar, así que `key={inBranch ? … : …}` es lo que hace que "Jugadores" se despliegue al llegar a `/players/registro` desde el buscador.
- **En modo icono se pierde todo lo que lleve `group-data-[collapsible=icon]:hidden`** — incluidos `SidebarMenuBadge` y `SidebarMenuSub`. Si un dato importa en esa vista hay que repintarlo: el partido en vivo sale como punto sobre el icono de `/live` (`LiveDot`).
- **`CommandDialog` de este repo NO envuelve a sus hijos en `<Command>`** como el de shadcn: hay que ponerlo tú o `CommandInput` revienta al montar buscando el store de cmdk. Y el popup de Base UI no lleva el foco al primer tabulable, así que `CommandInput` necesita `autoFocus` o el ⌘K abre un diálogo en el que no se puede escribir.
- **La sesión iniciada vive en `NavUser` (pie del sidebar)**, no en el header: `HeaderAuth` solo conserva los CTA de sesión cerrada.

### Imágenes: el tamaño se declara o se paga

La foto de un jugador es la misma para todo — la carta FIFA, el círculo de 32 px de una alineación, la ficha de 300 px — y en el bucket mide hasta 1054×1492. El navegador la descomprime entera aunque la pinte del tamaño de una moneda: **~6 MB de bitmap por foto**, independientes de lo que pesó el WebP. Por eso el problema no se ve en la pestaña de red (17 avatares = 517 KB transferidos) y sí en la memoria: `/matches/[id]/detail` llegó a 93 MB solo en imágenes, y eso es lo que atasca el scroll en un teléfono. Medido con `[...document.images].reduce((a,i)=>a+i.naturalWidth*i.naturalHeight*4,0)`.

- **Nunca un `<img>` crudo para una foto de jugador.** `next/image` o, si no cabe, la URL del optimizador.
- **`FifaCard` pide `sizes` obligatorio**: es el ancho real en que se pinta, en la sintaxis de `sizes`. Sin él no hay default sano — la misma carta mide 112 px en el spotlight y 300 px en la ficha.
- **`AvatarImage` reescribe su `src`** con `avatarSource()` (`lib/photo.ts`) al ancho del círculo. El default (128 px) cubre hasta `size-10`; **si el avatar es más grande —podio, tarjeta de MVP, ficha flotante, ganador de casacas— hay que pasarle `width`** o sale borroso. No se envuelve en `next/image` porque `Avatar.Image` de Base UI lleva la máquina de estados que decide cuándo enseñar el `AvatarFallback`.
- **Un `next/image` sin `sizes` pide `w=3840`** y se trae el original: el `width` declarado solo fija la relación de aspecto, no lo que se descarga.
- **`isOptimizablePhoto()` es la válvula de escape**: el formulario de jugador deja pegar una URL cualquiera, y el optimizador responde 400 a un host que no esté en `remotePatterns`. Esas van `unoptimized` / sin reescribir. Si añades un host a `next.config.ts`, añádelo también a `lib/photo.ts`.

### Movimiento y CSS moderno

- **View transitions**: `<ViewTransition>` viene en el React que empaqueta el App Router (canary); **no instales `react@canary`**. `@types/react` todavía no lo declara, así que los tipos están en `types/react-view-transition.d.ts` (bórralo cuando upstream los incluya).
  - Cada `page.tsx` jerárquica se envuelve en `<PageTransition>` (`components/app/page-transition.tsx`), **nunca un layout**: los layouts persisten y enter/exit no dispararían.
  - La dirección la marca el enlace con `transitionTypes={["nav-forward"]}` / `["nav-back"]`. Sin tipo (botón atrás del navegador, `router.refresh()`) cae en `default: "none"` y no anima.
  - Header y sidebar llevan `viewTransitionName: "app-header" / "app-sidebar"` para quedarse fijos; las reglas están en `globals.css`.
  - **El morph de elemento compartido (`name` + `share`) NO funciona aquí**: todas las páginas de detalle son `force-dynamic`, así que el destino no se renderiza en el mismo commit que la navegación y el par nunca se forma (es la precondición que documenta Next). Comprobado en `/players` → `/players/[id]`. Volvería a ser viable si esas rutas se pudieran prefetchear.
  - **También sirven sin navegar**, para cambios de estado dentro de un cliente — `/live` es el ejemplo (`components/features/live/live-match/`). Lo que hay que saber para replicarlo:
    - **El cambio de estado va en `React.startTransition`.** Un `setState` normal no activa nada; la única señal es la transición (o `useDeferredValue`/`Suspense`).
    - **Dos ramas de un `if` necesitan `key` distinta** (`key="setup"` / `key="live"`). Con la misma, React ve un solo `<ViewTransition>` al que le cambian los hijos —un `update`, o sea nada— en vez del par salir/entrar.
    - **Una pastilla que se desliza es un nodo aparte con `name` fijo**, renderizado solo bajo la opción activa (`live-team-count` + `share="count-pill"`). Como clase del botón activo no hay par que emparejar y solo parpadea; y el `old`/`new` van con `animation: none` para que viaje en vez de fundirse.
    - **Los ítems de una lista van `key` + `enter`/`exit` y SIN `default="none"`**: el `update` que eso deja vivo es lo que desliza a los que se quedan hacia su nueva celda.
    - **Lo que se desplaza porque la lista creció necesita su propio `<ViewTransition>` pelado**, y **hermano directo** de la lista o React ni lo mide. Solo se anima lo que cuelga de un límite activado; el resto teletransporta.
    - Un límite que se desmonta entero se lleva por delante a los `<ViewTransition>` anidados: solo anima el de fuera.
- **Reanimar algo cambiándole el `key`** (el dígito del marcador de `/live`, `score-pop`): el `key` va en un hijo único bajo un envoltorio fijo, **nunca en uno de varios hermanos estáticos**. Puesto directamente entre los hermanos del marcador (`0`, `:`, `0`), React montaba el número nuevo sin desmontar el viejo y se leía "01": mezclar hijos con y sin `key` bajo el mismo padre estático rompe la reconciliación por posición. Con el envoltorio, el hijo con `key` es el único de su nivel y el remonte vuelve a ser limpio.
- **Animaciones sin JS**: `.reveal-on-scroll` usa `animation-timeline: view()` (corre en el compositor, sin IntersectionObserver). El estado inicial vive dentro de `@supports`, así que donde no haya soporte el contenido queda visible en vez de invisible.
- `.card-shine` (banda diagonal al hover, solo `translate`) y `.crack-ring` (aro cónico giratorio, solo en la tarjeta de "El crack").
  - **El aro son dos capas y por eso lleva un `<span class="crack-ring-glow">` de verdad**, no un pseudo suelto: la máscara que lo recorta al borde tiene que quedarse quieta mientras el degradado gira por debajo. Si la máscara va en el mismo elemento que rota, lo que gira es la forma del aro y no el barrido.
  - **No animes el ángulo de un `conic-gradient`.** Esto lo hacía con `@property --ring-angle` y repintaba el degradado en cada fotograma, para siempre: una propiedad personalizada **no se compone** por mucho que esté registrada — registrarla solo consigue que interpole en vez de saltar. Ahora gira una capa ya rasterizada con `rotate`, que sí resuelve el compositor, y se ve idéntico (comparado fotograma a fotograma congelando las dos versiones al mismo `currentTime`).
  - La capa que gira mide 300% × 300% porque al rotar sobre su centro tiene que seguir tapando la tarjeta en cualquier ángulo. Y **necesita la máscara**: con `z-index: -1` se pinta encima del fondo de la tarjeta y la tiñe entera.
- Base moderna en `globals.css`: `color-scheme`, `interpolate-size: allow-keywords` (permite animar `height: auto`), `field-sizing: content` en textareas, `touch-action: manipulation`, `overscroll-behavior: contain` en overlays.
- **Enlaces**: `BreadcrumbLink` renderiza un `<a>` plano — sin `render={<Link/>}` provoca **recarga completa**. Siempre `<BreadcrumbLink render={<Link href=... />}>`.
- **Nunca anides `<a>` dentro de `<a>`** (p. ej. una tarjeta-enlace con un `<Button render={<Link/>}>` dentro): es HTML inválido, rompe la hidratación y hace que el botón interno navegue al destino de la tarjeta. Usa el patrón _stretched link_: la tarjeta `relative`, un único `<Link className="absolute inset-0">` como último hijo, y las acciones reales encima con `relative z-10`.

- Dashboard banner rotates a colored word via `getBannerWords()` = base `constants/rotatingWords.ts` + user `reta_words`, deduped; starts on index 0 so SSR/client match.

If a new Tailwind/`@theme` class doesn't appear, the long-running dev server may be serving stale CSS: `rm -rf .next/dev` and relaunch. Production build is the truth.
