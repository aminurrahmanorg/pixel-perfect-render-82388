import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Store } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Forgot password — Business Manager Pro" },
      { name: "description", content: "Request a password reset link." },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
    toast.success("If an account exists for this email, a reset link is on its way.");
  }

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="hidden flex-col justify-between bg-brand p-12 text-primary-foreground md:flex">
        <div className="flex items-center gap-2 font-display text-lg font-semibold">
          <Store /> Business Manager Pro
        </div>
        <p className="max-w-sm font-display text-3xl font-semibold leading-snug">
          Every sale, every bill, every balance — in one place.
        </p>
        <p className="text-sm opacity-80">Works in any country and any currency.</p>
      </div>
      <div className="flex items-center justify-center p-6">
        {sent ? (
          <div className="w-full max-w-sm space-y-4">
            <h1 className="text-2xl font-semibold">Check your email</h1>
            <p className="text-sm text-muted-foreground">
              If an account exists for {email.trim()}, we sent a password reset link. Check your
              inbox and spam folder.
            </p>
            <Button className="w-full" variant="outline" onClick={() => setSent(false)}>
              Try another email
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              <Link to="/auth" className="font-medium text-primary">
                Back to sign in
              </Link>
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="w-full max-w-sm space-y-5">
            <div>
              <h1 className="text-2xl font-semibold">Forgot password?</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter your account email and we&apos;ll send a reset link.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email</Label>
              <Input
                id="reset-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Sending…" : "Send reset link"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Remember your password?{" "}
              <Link to="/auth" className="font-medium text-primary">
                Sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
