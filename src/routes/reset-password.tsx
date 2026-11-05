import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — Business Manager Pro" },
      { name: "description", content: "Choose a new password for your account." },
      { property: "og:title", content: "Reset password — Business Manager Pro" },
      { property: "og:description", content: "Choose a new password for your account." },
    ],
  }),
  component: ResetPage,
});

function ResetPage() {
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    let active = true;
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active && session) setHasSession(true);
    });

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) toast.error(error.message);
        setHasSession(Boolean(data.session));
        setCheckingSession(false);
      })
      .catch((error: unknown) => {
        if (!active) return;
        toast.error(error instanceof Error ? error.message : "Could not verify the reset link.");
        setCheckingSession(false);
      });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      if (/session|token|expired|invalid/i.test(error.message)) setHasSession(false);
      return;
    }
    toast.success("Password updated");
    navigate({ to: "/dashboard" });
  }
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      {checkingSession ? (
        <p className="text-sm text-muted-foreground">Verifying your password reset link…</p>
      ) : hasSession ? (
        <form onSubmit={submit} className="w-full max-w-sm space-y-4">
          <h1 className="text-2xl font-semibold">Set a new password</h1>
          <div className="space-y-2">
            <Label htmlFor="pw">New password</Label>
            <div className="relative">
              <Input
                id="pw"
                type={showPassword ? "text" : "password"}
                minLength={6}
                required
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
          <Button className="w-full" disabled={busy}>
            Update password
          </Button>
        </form>
      ) : (
        <div className="w-full max-w-sm space-y-4 text-center">
          <h1 className="text-2xl font-semibold">Reset link is invalid or expired</h1>
          <p className="text-sm text-muted-foreground">
            Request a new reset email and open its link in this browser. If this keeps happening,
            add this site&apos;s URL to Supabase Auth&apos;s allowed redirect URLs.
          </p>
          <Button asChild className="w-full">
            <Link to="/auth">Request another reset link</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
