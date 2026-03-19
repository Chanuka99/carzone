"use client";

import { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogBody } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { verifyPasswordAction } from "@/app/actions/auth";
import { Lock, AlertTriangle } from "lucide-react";

interface PasswordConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  onConfirm: () => void | Promise<void>;
}

export default function PasswordConfirmModal({
  open,
  onOpenChange,
  title = "Confirm Action",
  description = "Please enter your password to confirm this action.",
  onConfirm,
}: PasswordConfirmModalProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleConfirm() {
    if (!password.trim()) {
      setError("Password is required");
      return;
    }

    startTransition(async () => {
      const valid = await verifyPasswordAction(password);
      if (!valid) {
        setError("Incorrect password. Please try again.");
        return;
      }
      setPassword("");
      setError(null);
      onOpenChange(false);
      await onConfirm();
    });
  }

  function handleClose() {
    setPassword("");
    setError(null);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
              <Lock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription className="mt-0.5">{description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogBody>
          <div className="flex items-start gap-2 mb-4 bg-amber-50 border border-amber-100 rounded-lg p-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">This action cannot be easily undone. Confirm only if you are sure.</p>
          </div>

          <div>
            <Label htmlFor="confirm-password">Your Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null); }}
              placeholder="Enter your password"
              className="mt-1.5"
              onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
              autoFocus
            />
            {error && <p className="text-xs text-red-600 mt-1.5">{error}</p>}
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isPending}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={isPending || !password.trim()}>
            {isPending ? "Verifying..." : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
