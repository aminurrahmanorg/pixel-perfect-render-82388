import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";

/** Uploads an image to private storage under the user's folder and returns a long-lived signed URL. */
export function ImageUpload({ value, onChange, label = "Upload photo" }: { value?: string | null; onChange: (url: string | null) => void; label?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const upload = async (file: File) => {
    if (!file.type.startsWith("image/")) return void toast.error("Please choose an image file");
    if (file.size > 5 * 1024 * 1024) return void toast.error("Image must be under 5 MB");
    setBusy(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return void toast.error("Please sign in again");
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${u.user.id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("images").upload(path, file, { contentType: file.type });
      if (error) return void toast.error(error.message);
      const { data, error: e2 } = await supabase.storage.from("images").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
      if (e2 || !data) return void toast.error(e2?.message ?? "Upload failed");
      onChange(data.signedUrl);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="flex items-center gap-3">
      <div className="size-16 shrink-0 overflow-hidden rounded-md border bg-muted">
        {value ? <img src={value} alt="" className="size-full object-cover" /> : <ImagePlus className="m-auto mt-5 size-5 text-muted-foreground" />}
      </div>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); e.target.value = ""; }} />
      <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => ref.current?.click()}>
        {busy ? <Loader2 className="animate-spin" /> : <ImagePlus />} {value ? "Change" : label}
      </Button>
      {value && <Button type="button" variant="ghost" size="icon" aria-label="Remove photo" onClick={() => onChange(null)}><X className="size-4" /></Button>}
    </div>
  );
}
