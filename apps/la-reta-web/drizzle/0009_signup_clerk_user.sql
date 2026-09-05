-- Guarda de qué cuenta de Clerk salió una solicitud, para que al aprobarla la
-- ficha nazca ya vinculada a su dueño. Aditiva y nullable: las solicitudes que
-- ya están en la tabla (y las del formulario público de la web, que no pide
-- cuenta) se quedan en NULL sin romper nada.
ALTER TABLE "player_signups" ADD COLUMN IF NOT EXISTS "clerk_user_id" text;
