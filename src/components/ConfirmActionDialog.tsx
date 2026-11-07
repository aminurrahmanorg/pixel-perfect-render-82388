import { useState, type ReactElement } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

type ConfirmActionDialogProps = {
  title: string;
  description: string;
  actionLabel: string;
  pendingLabel?: string;
  onConfirm: () => Promise<boolean>;
  children: ReactElement;
};

export function ConfirmActionDialog({ title, description, actionLabel, pendingLabel = "Deleting...", onConfirm, children }: ConfirmActionDialogProps) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function confirm() {
    setPending(true);
    let succeeded = false;
    try {
      succeeded = await onConfirm();
    } finally {
      setPending(false);
    }
    if (succeeded) setOpen(false);
  }

  return (
    <AlertDialog open={open} onOpenChange={(nextOpen) => { if (!pending) setOpen(nextOpen); }}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <Button variant="destructive" disabled={pending} onClick={() => void confirm()}>{pending ? pendingLabel : actionLabel}</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
