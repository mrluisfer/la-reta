"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Player } from "@/lib/db/schema";
import { initials } from "@/lib/format";
import { ShirtIcon } from "lucide-react";

export const WinnerDialog = ({
  winner,
  onClose,
}: {
  readonly winner: Player | null;
  readonly onClose: () => void;
}) => {
  return (
    <Dialog open={winner != null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShirtIcon className="text-primary size-5" />
            ¡Le toca lavar!
          </DialogTitle>
          <DialogDescription>
            La ruleta decidió quién lava las casacas de esta reta.
          </DialogDescription>
        </DialogHeader>
        {winner ? (
          <div className="flex items-center gap-4 py-2">
            <Avatar size="lg" className="size-16">
              {winner.photoUrl ? (
                <AvatarImage src={winner.photoUrl} alt="" width={256} />
              ) : null}
              <AvatarFallback>{initials(winner.displayName)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-xl font-bold">{winner.displayName}</p>
              <p className="text-muted-foreground text-sm">{winner.name}</p>
            </div>
          </div>
        ) : null}
        <DialogFooter>
          <DialogClose render={<Button>Entendido</Button>} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
