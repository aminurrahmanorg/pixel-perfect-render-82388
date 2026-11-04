import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { askAssistant } from "@/lib/ai.functions";
import { Bot, Loader2, Send, Sparkles, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/_app/assistant")({
  head: () => ({ meta: [{ title: "AI Assistant — Business Manager Pro" }] }),
  component: AssistantPage,
});

type Msg = { role: "user" | "assistant"; content: string };
const SUGGEST = [
  "How much profit did I make last week?",
  "Which customers owe me the most?",
  "What are my best and slowest selling products?",
  "এই মাসে খরচ কোথায় বেশি হচ্ছে?",
  "Which items should I restock or discount?",
];

function AssistantPage() {
  const ask = useServerFn(askAssistant);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, busy]);

  async function send(text: string) {
    const t = text.trim();
    if (!t || busy) return;
    const next = [...msgs, { role: "user" as const, content: t }];
    setMsgs(next); setQ(""); setBusy(true); setErr("");
    try {
      const res = await ask({ data: { messages: next } });
      if (res.error) { setErr(res.error); setQ(t); setMsgs(msgs); }
      else setMsgs([...next, { role: "assistant", content: res.text }]);
    } catch {
      setErr("Something went wrong. Please try again."); setQ(t); setMsgs(msgs);
    } finally { setBusy(false); }
  }

  return (
    <div className="flex h-[calc(100dvh-7rem)] flex-col">
      <PageHeader title="AI Assistant" subtitle="Ask anything about your sales, profit, customers and stock" />
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto rounded-xl border bg-card p-4 shadow-card">
        {msgs.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl gradient-primary text-primary-foreground"><Sparkles className="size-7" /></span>
            <p className="max-w-md text-sm text-muted-foreground">I read your live store data and answer in Bangla or English. Try one of these:</p>
            <div className="flex max-w-2xl flex-wrap justify-center gap-2">
              {SUGGEST.map((s) => <button key={s} onClick={() => send(s)} className="rounded-full border bg-background px-3 py-1.5 text-sm hover:border-primary hover:text-primary">{s}</button>)}
            </div>
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={cn("flex gap-3", m.role === "user" && "flex-row-reverse")}>
            <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", m.role === "user" ? "bg-secondary" : "bg-primary/15 text-primary")}>{m.role === "user" ? <UserRound className="size-4" /> : <Bot className="size-4" />}</span>
            <div className={cn("max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm", m.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary")}>{m.content}</div>
          </div>
        ))}
        {busy && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Analysing your data…</div>}
        <div ref={end} />
      </div>
      {err && <p className="mt-2 text-sm text-destructive">{err}</p>}
      <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); void send(q); }}>
        <Textarea rows={1} className="min-h-11 resize-none" placeholder="Ask about your business…" value={q} onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(q); } }} />
        <Button type="submit" size="icon" className="size-11 shrink-0" disabled={busy || !q.trim()} aria-label="Send"><Send /></Button>
      </form>
    </div>
  );
}
