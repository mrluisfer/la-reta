import { LiveLock } from "@/components/features/live/live-lock";
import { LiveMatch } from "@/components/features/live/live-match";
import { PageHeader } from "@/components/shared/page-header";
import { isLiveUnlocked } from "@/lib/admin";
import { getPlayers } from "@/lib/queries";
import { Metadata } from "next";

export const metadata: Metadata = { title: "En vivo · Reta Fútbol" };
export const dynamic = "force-dynamic";

const LivePage = async () => {
  const [players, unlocked] = await Promise.all([
    getPlayers(),
    isLiveUnlocked(),
  ]);
  // Solo lo que el marcador necesita para pintar a alguien reconocible: mandar
  // el `Player` entero cruzaría al cliente los seis atributos y la fecha de
  // nacimiento de toda la plantilla para dibujar una lista.
  const list = [...players]
    .map((p) => ({
      id: p.id,
      name: p.name,
      displayName: p.displayName,
      photoUrl: p.photoUrl,
      position: p.position,
      overall: p.overall,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="container space-y-6 lg:mx-auto">
      <PageHeader
        title="Marcador en vivo"
        description="Apunta los goles según van cayendo. Cada equipo tiene su botón, así que da igual quién esté jugando contra quién: al terminar, la reta entera se guarda como un registro con los goles de cada quien."
      />
      {unlocked ? <LiveMatch players={list} /> : <LiveLock />}
    </div>
  );
};

export default LivePage;
