import { Player } from "@/lib/db/schema";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "../../ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../ui/card";
import { RankingList } from "./ranking-list";

export const RankingLevel = ({ players }: { readonly players: Player[] }) => {
  const ranking = players.slice(0, 6);
  return (
    <Card className="h-fit" size="sm">
      <CardHeader className="border-b">
        <CardTitle className="font-display text-lg font-semibold tracking-wide uppercase">
          Ranking de nivel
        </CardTitle>
        <CardAction>
          <Button variant="default" render={<Link href="/players" />}>
            Todos
            <ArrowRightIcon />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <RankingList players={ranking} />
      </CardContent>
    </Card>
  );
};
