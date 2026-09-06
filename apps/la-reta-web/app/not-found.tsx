import { ErrorState } from "@/components/app/error-state";
import { SearchXIcon } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "No encontrado · Reta Fútbol",
};

const NotFound = () => {
  return (
    <ErrorState
      code="404"
      icon={<SearchXIcon />}
      title="No encontramos esta jugada"
      description="La página pudo moverse, eliminarse o quizá el enlace no existe dentro de la reta."
      details="Puedes volver al inicio o revisar el historial de partidos para retomar desde una vista conocida."
    />
  );
};

export default NotFound;
