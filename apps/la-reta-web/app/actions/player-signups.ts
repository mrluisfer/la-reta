"use server";

import { cleanPersonName, personNameError } from "@repo/reta/names";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import type { Foot, SignupStatus } from "@/lib/constants";
import { isAdmin } from "@/lib/admin";
import { FEET, POSITIONS, SIGNUP_STATUSES } from "@/lib/constants";
import { db, playerSignups } from "@/lib/db";

type Result = { ok: true; id?: number } | { ok: false; error: string };

export interface SignupClientInfo {
  language?: string;
  languages?: string;
  timezone?: string;
  timezoneOffset?: number;
  screen?: string;
  viewport?: string;
  pixelRatio?: string;
  platform?: string;
  userAgent?: string;
}

export interface PlayerSignupInput {
  name: string;
  displayName?: string;
  position: string;
  position2?: string;
  preferredFoot?: string;
  nationality?: string;
  photoUrl?: string;
  birthDate?: string;
  heightCm?: string | number;
  weightKg?: string | number;
  contact?: string;
  note?: string;
  /**
  Cuenta de Clerk de quien la manda, si la petición venía con sesión.
  */
  clerkUserId?: string | null;
  client?: SignupClientInfo;
}

const inList = <T extends readonly string[]>(
  list: T,
  value: string | undefined
): value is T[number] => value !== undefined && list.includes(value);

const smallintOrNull = (value: string | number | undefined) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
};

/**
Rutas que se revalidan al tocar la cola de solicitudes.
*/
const ADMIN_PATH = "/admin/registros";
const PLAYERS_PATH = "/players";

/**
Recorta y acota; vacío cuenta como ausente, que es lo que guarda la tabla.
*/
function safeText(value: string | null | undefined, maxLength: number) {
  const clean = value?.trim();
  return clean === undefined || clean.length === 0
    ? null
    : clean.slice(0, maxLength);
}

async function collectRequestInfo() {
  const headerStore = await headers();
  const forwardedFor = headerStore.get("x-forwarded-for");

  return {
    ipAddress: safeText(
      headerStore.get("cf-connecting-ip") ??
        headerStore.get("x-real-ip") ??
        forwardedFor?.split(",", 1)[0]?.trim(),
      64
    ),
    forwardedFor: safeText(forwardedFor, 500),
    country: safeText(
      headerStore.get("cf-ipcountry") ?? headerStore.get("x-vercel-ip-country"),
      8
    ),
    region: safeText(headerStore.get("x-vercel-ip-country-region"), 120),
    city: safeText(headerStore.get("x-vercel-ip-city"), 120),
    latitude: safeText(headerStore.get("x-vercel-ip-latitude"), 40),
    longitude: safeText(headerStore.get("x-vercel-ip-longitude"), 40),
    acceptLanguage: safeText(headerStore.get("accept-language"), 240),
  };
}

/**
 * El rastro del cliente que manda la solicitud. Sale de `createPlayerSignup`
 * para que ese siga contando lo que hace —validar y guardar— y no doce líneas
 * de copiar campos con su tope de caracteres.
 */
function clientColumns(client: SignupClientInfo | undefined) {
  return {
    language: safeText(client?.language, 24),
    languages: safeText(client?.languages, 240),
    timezone: safeText(client?.timezone, 64),
    timezoneOffset:
      typeof client?.timezoneOffset === "number" ? client.timezoneOffset : null,
    screen: safeText(client?.screen, 32),
    viewport: safeText(client?.viewport, 32),
    pixelRatio: safeText(client?.pixelRatio, 16),
    platform: safeText(client?.platform, 80),
    userAgent: client?.userAgent ?? null,
  };
}

export async function createPlayerSignup(
  input: PlayerSignupInput
): Promise<Result> {
  // La misma regla que aplica la app mientras se escribe. Aquí no es cortesía:
  // el cliente es sugerencia, esto es la puerta.
  const name = cleanPersonName(input.name);
  const nameError = personNameError(name);
  if (nameError !== null) {
    return { ok: false, error: nameError };
  }
  if (!inList(POSITIONS, input.position)) {
    return { ok: false, error: "Elige una posición." };
  }

  const { position } = input;
  const position2 =
    inList(POSITIONS, input.position2) && input.position2 !== position
      ? input.position2
      : null;
  const preferredFoot: Foot = inList(FEET, input.preferredFoot)
    ? input.preferredFoot
    : "right";

  const requestInfo = await collectRequestInfo();

  const [row] = await db
    .insert(playerSignups)
    .values({
      name: name.slice(0, 120),
      displayName: safeText(cleanPersonName(input.displayName ?? ""), 60),
      position,
      position2,
      preferredFoot,
      nationality: safeText(input.nationality?.toLowerCase(), 2) ?? "mx",
      photoUrl: safeText(input.photoUrl, 500),
      birthDate: safeText(input.birthDate, 10),
      heightCm: smallintOrNull(input.heightCm),
      weightKg: smallintOrNull(input.weightKg),
      contact: safeText(input.contact, 160),
      note: safeText(input.note, 2000),
      clerkUserId: safeText(input.clerkUserId, 120),
      ...clientColumns(input.client),
      ...requestInfo,
    })
    .returning({ id: playerSignups.id });

  revalidatePath(ADMIN_PATH);
  revalidatePath(PLAYERS_PATH);
  return { ok: true, id: row.id };
}

export async function updateSignupStatus(
  id: number,
  status: string,
  adminNotes?: string
): Promise<Result> {
  if (!(await isAdmin())) {
    return { ok: false, error: "No autorizado." };
  }
  const next: SignupStatus = inList(SIGNUP_STATUSES, status)
    ? status
    : "pendiente";

  await db
    .update(playerSignups)
    .set({
      status: next,
      // Solo se escribe si el llamador la manda. `AdminSignups` cambia el
      // estado sin notas, y `safeText(undefined)` es null: tal cual, cada
      // cambio de estado borraba las notas que ya hubiera.
      ...(adminNotes !== undefined && {
        adminNotes: safeText(adminNotes, 2000),
      }),
      updatedAt: new Date(),
    })
    .where(eq(playerSignups.id, id));

  revalidatePath(ADMIN_PATH);
  revalidatePath(PLAYERS_PATH);
  return { ok: true, id };
}

export async function deleteSignup(id: number): Promise<Result> {
  if (!(await isAdmin())) {
    return { ok: false, error: "No autorizado." };
  }
  await db.delete(playerSignups).where(eq(playerSignups.id, id));
  revalidatePath(ADMIN_PATH);
  revalidatePath(PLAYERS_PATH);
  return { ok: true, id };
}
