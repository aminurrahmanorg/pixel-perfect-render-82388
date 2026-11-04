import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Store, MessageCircle, MonitorSmartphone, ShoppingCart, Receipt, Landmark,
  FileBarChart, Users, ChartColumn, History, ShoppingBag, HandCoins,
  ArrowLeftRight, Printer, ShieldCheck, Clock, PhoneCall, CheckCircle2,
  TrendingUp, Wallet, Sparkles, BadgeCheck, Play, Loader2,
} from "lucide-react";
import heroOwnerImg from "@/assets/landing/hero-owner.jpg";
import ownerImg from "@/assets/landing/owner.jpg";
import productsImg from "@/assets/landing/products.jpg";
import shotDashboard from "@/assets/landing/shot-dashboard.webp";
import shotPos from "@/assets/landing/shot-pos.webp";
import shotCustomers from "@/assets/landing/shot-customers.webp";
import shotReports from "@/assets/landing/shot-reports.webp";
import shotInventory from "@/assets/landing/shot-inventory.webp";
import shotPosMobile from "@/assets/landing/shot-pos-mobile.webp";
import promoVideo from "@/assets/videos/business-software-bangla-v3.mp4.asset.json";
import { TutorialVideo } from "@/components/tutorial-video";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Business Manager Pro — আপনার ব্যবসার সম্পূর্ণ হিসাব এক জায়গায়" },
      { name: "description", content: "বিক্রি, খরচ, ক্যাশ, ব্যাংক, লাভ-ক্ষতি — সব হিসাব এক সফটওয়্যারে। যেকোনো দোকান বা ব্যবসার জন্য। মাত্র ৳৯,৯৯৯, ১ বছর ফ্রি সাপোর্ট। WhatsApp-এ ডেমো চান।" },
      { property: "og:title", content: "Business Manager Pro — ব্যবসার সম্পূর্ণ হিসাব" },
      { property: "og:description", content: "আয়-ব্যয়, লাভ-ক্ষতি, স্টাফ, রিপোর্ট — সব এক জায়গায়। মাত্র ৳৯,৯৯৯।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const WA = "https://wa.me/8801792490604?text=" + encodeURIComponent("আসসালামু আলাইকুম! Business Manager Pro-এর ডেমো দেখতে চাই।");

function DemoButton({ label = "WhatsApp-এ ফ্রি ডেমো চান" }: { label?: string }) {
  return (
    <div className="mt-8 flex justify-center">
      <Button asChild size="lg" className="gap-2 bg-success text-success-foreground hover:bg-success/90">
        <a href={WA} target="_blank" rel="noreferrer">
          <MessageCircle className="size-5" /> {label}
        </a>
      </Button>
    </div>
  );
}

const DEMO_EMAIL = "demo@admin.com";
const DEMO_PASSWORD = "12345678";

function LiveDemoButton({ size = "lg", className = "" }: { size?: "sm" | "lg"; className?: string }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  async function enterDemo() {
    if (loading) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: DEMO_EMAIL, password: DEMO_PASSWORD });
      if (error) throw error;
      navigate({ to: "/dashboard" });
    } catch {
      toast.error("ডেমোতে ঢোকা যাচ্ছে না — একটু পরে আবার চেষ্টা করুন");
      setLoading(false);
    }
  }

  return (
    <Button size={size} onClick={enterDemo} disabled={loading} className={`gap-2 ${className}`}>
      {loading ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
      {loading ? "ঢুকছে..." : "লাইভ ডেমো দেখুন"}
    </Button>
  );
}

const pains = [
  { icon: Receipt, t: "খাতায় হিসাব হারিয়ে যায়", d: "দিনশেষে মিলানো যায় না — কত বিকল, কত খরচ, কেউ জানে না।" },
  { icon: Wallet, t: "ক্যাশ আর ব্যাংকের হিসাব আলাদা", d: "কোন টাকা কোথায় আছে, এক নজরে দেখার উপায় নেই।" },
  { icon: TrendingUp, t: "লাভ না লস — অনুমানে চলে", d: "মাসশেষে হিসাব করতে গিয়ে দেখেন আসলে লস হয়েছে।" },
  { icon: Users, t: "স্টাফ আর বেতনের ঝামেলা", d: "কে কবে জয়েন করল, কার বেতন কত — মনে রাখা কঠিন।" },
];

const features = [
  { icon: MonitorSmartphone, t: "স্মার্ট POS", d: "মোবাইল, ট্যাব বা কম্পিউটারে এক ট্যাপে বিক্রি, সাথে সাথে রশিদ প্রিন্ট।" },
  { icon: ShoppingCart, t: "বিক্রির হিসাব", d: "প্রতিটা বিক্রি — ডিসকাউন্ট, ভ্যাট/ট্যাক্স সহ — স্বয়ংক্রিয়ভাবে জমা হয়।" },
  { icon: Receipt, t: "খরচের খাতা", d: "ভাড়া, মালামাল, বিল — প্রতিটা খরচ ক্যাটাগরি অনুযায়ী সাজানো।" },
  { icon: Landmark, t: "ক্যাশ · ব্যাংক · ওয়ালেট", d: "সব অ্যাকাউন্টের লাইভ ব্যালেন্স, এক অ্যাকাউন্ট থেকে আরেকটায় ট্রান্সফার।" },
  { icon: FileBarChart, t: "লাভ-ক্ষতি রিপোর্ট", d: "পণ্যের খরচ বাদে আসল লাভ — প্রতিদিন, প্রতি মাসে, স্বয়ংক্রিয়।" },
  { icon: ChartColumn, t: "তারিখ-টু-তারিখ রিপোর্ট", d: "যেকোনো সময়ের রিপোর্ট, সবচেয়ে বেশি বিক্রি হওয়া পণ্যসহ।" },
  { icon: Users, t: "স্টাফ ম্যানেজমেন্ট", d: "স্টাফের তথ্য, পদবি, বেতন — মাসিক পেরোল এক ক্লিকে।" },
  { icon: ShoppingBag, t: "পণ্য ও ছবি", d: "প্রতিটা পণ্যের দাম, খরচ আর ছবি — POS-এ সুন্দরভাবে দেখায়।" },
  { icon: Printer, t: "রশিদ ও ইনভয়েস প্রিন্ট", d: "৮০মিমি রশিদ আর A4 ইনভয়েস — এক ক্লিকে প্রিন্ট।" },
  { icon: HandCoins, t: "অন্যান্য আয়", d: "পাইকারি অর্ডার, কমিশন, ভাড়া — দোকানের বাইরের আয়ও হিসাবে থাকে।" },
  { icon: ArrowLeftRight, t: "অ্যাকাউন্ট ট্রান্সফার", d: "ক্যাশ থেকে ব্যাংকে জমা — ব্যালেন্স চেক সহ নিরাপদ ট্রান্সফার।" },
  { icon: History, t: "অ্যাক্টিভিটি লগ", d: "কে, কখন, কী যোগ বা বদলাল — সবকিছুর রেকর্ড থাকে।" },
];

const steps = [
  { n: "১", t: "WhatsApp-এ মেসেজ দিন", d: "নিচের বাটনে ক্লিক করে ডেমো চান — ৫ মিনিটেই উত্তর পাবেন।" },
  { n: "২", t: "ফ্রি ডেমো দেখুন", d: "আপনার ব্যবসার মতো করে সাজিয়ে পুরো সিস্টেম দেখিয়ে দেব।" },
  { n: "৩", t: "আজই শুরু করুন", d: "অ্যাকাউন্ট সেটআপ থেকে শুরু — আমরা সব করে দেব, আপনি শুধু ব্যবহার করবেন।" },
];

const checks = [
  "পুরো সিস্টেম — POS, হিসাব, রিপোর্ট, স্টাফ",
  "১ বছর সম্পূর্ণ ফ্রি সাপোর্ট",
  "মোবাইল, ট্যাব, কম্পিউটার — সব ডিভাইসে চলে",
  "আপনার ডেটা ১০০% নিরাপদ ও শুধু আপনার",
  "যেকোনো কারেন্সি — টাকা, ডলার, রিয়াল সব",
  "নতুন ফিচার আপডেট ফ্রি",
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-2 font-display text-base font-semibold md:text-lg">
            <span className="grid size-9 place-items-center rounded-lg bg-brand text-primary-foreground"><Store className="size-5" /></span>
            Business Manager Pro
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm"><Link to="/auth">লগইন</Link></Button>
            <LiveDemoButton size="sm" />
            <Button asChild size="sm" className="hidden gap-1.5 bg-success text-success-foreground hover:bg-success/90 sm:inline-flex">
              <a href={WA} target="_blank" rel="noreferrer"><MessageCircle className="size-4" /> ডেমো চাই</a>
            </Button>
          </div>
        </div>
      </header>

      {/* Promo video */}
      <section className="border-b bg-secondary/50">
        <div className="mx-auto max-w-5xl px-4 py-16 md:px-6 md:py-24">
          <h2 className="text-center font-display text-2xl font-bold md:text-4xl">২ মিনিটেই দেখে নিন পুরো সফটওয়্যার</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
            POS থেকে রিপোর্ট — সবকিছু কীভাবে কাজ করে, এই ছোট ভিডিওতেই দেখে নিন।
          </p>
          <div className="mt-10 overflow-hidden rounded-2xl border shadow-card">
            <video
              src={promoVideo.url}
              poster={heroOwnerImg}
              controls
              playsInline
              preload="metadata"
              width={1920}
              height={1080}
              className="w-full"
              aria-label="Business Manager Pro সফটওয়্যারের বাংলা ভয়েসওভারসহ ভিডিও"
            />
          </div>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <LiveDemoButton />
            <Button asChild size="lg" className="gap-2 bg-success text-success-foreground hover:bg-success/90">
              <a href={WA} target="_blank" rel="noreferrer"><MessageCircle className="size-5" /> WhatsApp-এ ডেমো চাই</a>
            </Button>
          </div>
          <p className="mt-3 text-center text-sm text-muted-foreground">লাইভ ডেমোতে ক্লিক করলেই সরাসরি সফটওয়্যারের ভেতরে ঢুকে যাবেন — কোনো সাইনআপ লাগবে না</p>
        </div>
      </section>

      {/* Tutorial video (YouTube, autoplay) */}
      <section className="border-b bg-background">
        <div className="mx-auto max-w-5xl px-4 py-16 md:px-6 md:py-24">
          <h2 className="text-center font-display text-2xl font-bold md:text-4xl">কীভাবে ব্যবহার করবেন — সম্পূর্ণ টিউটোরিয়াল</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
            লগইন থেকে বিক্রি, কাস্টমার, স্টক আর রিপোর্ট — পুরো সিস্টেমের ব্যবহার এই টিউটোরিয়ালে।
            <span className="mt-1 block text-sm font-medium text-foreground">🔊 শব্দসহ শুনতে "শব্দ চালু করুন" বাটনে ক্লিক করুন</span>
          </p>
          <TutorialVideo />
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <LiveDemoButton />
            <Button asChild size="lg" className="gap-2 bg-success text-success-foreground hover:bg-success/90">
              <a href={WA} target="_blank" rel="noreferrer"><MessageCircle className="size-5" /> WhatsApp-এ ডেমো চাই</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand/10 via-transparent to-accent/20" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-24 pt-14 md:px-6 md:pb-28 md:pt-20 lg:grid-cols-[1.05fr_1fr]">
          <div className="text-center lg:text-left">
            <p className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-accent-foreground md:text-sm">
              <Sparkles className="size-4" /> ৫০০+ ব্যবসায়ীর আস্থার নাম
            </p>
            <h1 className="mt-5 font-display text-3xl font-bold leading-tight text-foreground md:text-5xl lg:text-6xl">
              আপনার ব্যবসার প্রতিটা টাকার হিসাব — এখন আপনার হাতের মুঠোয়
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground md:text-lg lg:mx-0">
              ব্যবসা চালান অনুমানে নয় — নিখুঁত হিসাবে। আজ কত বিকল, কত খরচ, কত লাভ —
              মুহূর্তেই স্ক্রিনে। বিক্রি, খরচ, ক্যাশ, ব্যাংক, স্টাফ, লাভ-ক্ষতি — সবকিছু এক সফটওয়্যারে।
              দোকান, পাইকারি, অনলাইন — যেকোনো ব্যবসার জন্য।
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
              <LiveDemoButton />
              <Button asChild size="lg" className="gap-2 bg-success text-success-foreground hover:bg-success/90">
                <a href={WA} target="_blank" rel="noreferrer"><MessageCircle className="size-5" /> WhatsApp-এ ফ্রি ডেমো চান</a>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/auth">ফ্রি ট্রায়াল শুরু করুন</Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">মাত্র ৳৯,৯৯৯ · ১ বছর ফ্রি সাপোর্ট · ক্রেডিট কার্ড লাগবে না</p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
              {["লাইভ লাভ-ক্ষতি রিপোর্ট", "ক্যাশ-ব্যাংক ব্যালেন্স এক নজরে", "দিনশেষে হিসাব মিলিয়ে নিন"].map((x) => (
                <span key={x} className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs font-medium shadow-card">
                  <CheckCircle2 className="size-3.5 text-success" /> {x}
                </span>
              ))}
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-xl">
            <img src={heroOwnerImg} alt="খুশি দোকান মালিক ল্যাপটপে ব্যবসার হিসাব দেখছেন" width={1600} height={900} className="w-full rounded-2xl object-cover shadow-lg" />
            <div className="absolute -bottom-8 left-4 right-4 rounded-xl border bg-card/95 p-4 shadow-lg backdrop-blur sm:left-6 sm:right-auto sm:w-80">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">আজকের হিসাব</p>
              <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="font-display text-lg font-bold leading-none md:text-xl">৳২৪,৮৫০</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">আজকের বিক্রি</p>
                </div>
                <div>
                  <p className="font-display text-lg font-bold leading-none text-success md:text-xl">৳৬,২৩০</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">আজকের লাভ</p>
                </div>
                <div>
                  <p className="font-display text-lg font-bold leading-none md:text-xl">১২৪</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">অর্ডার</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Owner photo + emotional copy */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <img src={ownerImg} alt="দোকান মালিক POS ব্যবহার করছেন" loading="lazy" width={1024} height={1024} className="w-full rounded-2xl object-cover shadow-card" />
          <div>
            <h2 className="font-display text-2xl font-bold md:text-4xl">কল্পনা করুন — দোকানে না থেকেও সব হিসাব আপনার পকেটে</h2>
            <p className="mt-4 text-muted-foreground">
              বাড়িতে বসে থাকুন বা অন্য শাখায় — মোবাইল খুললেই দেখবেন আজ কত বিকল,
              খরচ কত, পকেটে লাভ কত। কোনো কর্মচারী আর টাকা আত্মসাৎ করতে পারবে না,
              কারণ প্রতিটা টাকার রেকর্ড থাকে।
            </p>
            <ul className="mt-6 space-y-3">
              {["প্রতিদিনের বিক্রি আর লাভ এক নজরে", "কোন পণ্য সবচেয়ে বেশি বিকছে — সঙ্গে সঙ্গে জানুন", "মাসশেষে হিসাবের জন্য হিসাবরক্ষক লাগবে না"].map((x) => (
                <li key={x} className="flex items-start gap-2.5 text-sm font-medium">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" /> {x}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <DemoButton />
      </section>

      {/* Pain points */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
        <h2 className="text-center font-display text-2xl font-bold md:text-4xl">এই সমস্যাগুলো কি আপনারও?</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">প্রতিদিন হাজারো ব্যবসায়ী একই সমস্যায় ভুগছেন — আপনি একা নন।</p>
        <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {pains.map((p) => (
            <div key={p.t} className="rounded-xl border bg-card p-5 shadow-card">
              <span className="grid size-11 place-items-center rounded-lg bg-destructive/10 text-destructive"><p.icon className="size-5" /></span>
              <h3 className="mt-4 font-semibold">{p.t}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{p.d}</p>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-8 max-w-2xl text-center text-base font-medium">
          ভালো খবর — <span className="text-primary">এই সব সমস্যার একটাই সমাধান আছে।</span>
        </p>
        <DemoButton />
      </section>

      {/* Features */}
      <section className="border-y bg-secondary/50">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
          <h2 className="text-center font-display text-2xl font-bold md:text-4xl">একটা সিস্টেমে যা যা পাচ্ছেন</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">যেকোনো ব্যবসা চালাতে যা যা লাগে — সবকিছু ভেবে বানানো।</p>
          <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {features.map((f) => (
              <div key={f.t} className="rounded-xl border bg-card p-5 shadow-card transition-shadow hover:shadow-lg">
                <span className="grid size-11 place-items-center rounded-lg bg-accent text-accent-foreground"><f.icon className="size-5" /></span>
                <h3 className="mt-4 font-semibold">{f.t}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.d}</p>
              </div>
            ))}
          </div>
          <DemoButton />
        </div>
      </section>


      {/* Real screenshots gallery */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
        <h2 className="text-center font-display text-2xl font-bold md:text-4xl">নিজে চোখে দেখুন — আসল সফটওয়্যারের ভেতরটা</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
          এই স্ক্রিনগুলোই আপনার হবে — ডেমো ডেটা নয়, আসল সফটওয়্যারের স্ক্রিনশট।
        </p>
        <div className="mt-10 grid items-start gap-4 lg:grid-cols-[2.2fr_1fr]">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="overflow-hidden rounded-2xl border shadow-card sm:col-span-2">
              <img src={shotDashboard} alt="ড্যাশবোর্ড — আজকের বিক্রি, লাভ, অ্যাকাউন্ট ব্যালেন্স এক স্ক্রিনে" loading="lazy" width={1280} height={800} className="w-full" />
              <div className="border-t bg-card px-4 py-2.5 text-sm font-medium">📊 ড্যাশবোর্ড — আজকের বিক্রি, খরচ, লাভ আর সব অ্যাকাউন্টের ব্যালেন্স এক নজরে</div>
            </div>
            <div className="overflow-hidden rounded-2xl border shadow-card">
              <img src={shotPos} alt="POS — ছবিসহ পণ্য থেকে এক ট্যাপে বিক্রি" loading="lazy" width={1280} height={800} className="w-full" />
              <div className="border-t bg-card px-4 py-2.5 text-sm font-medium">🛒 POS — ছবিসহ পণ্য, এক ট্যাপে বিক্রি</div>
            </div>
            <div className="overflow-hidden rounded-2xl border shadow-card">
              <img src={shotReports} alt="রিপোর্ট — বেস্ট সেলিং পণ্য ও দিনশেষের হিসাব" loading="lazy" width={1280} height={800} className="w-full" />
              <div className="border-t bg-card px-4 py-2.5 text-sm font-medium">📈 রিপোর্ট — বেস্ট সেলিং পণ্য ও দিনশেষের হিসাব</div>
            </div>
            <div className="overflow-hidden rounded-2xl border shadow-card">
              <img src={shotCustomers} alt="কাস্টমার — বাকি, পয়েন্ট ও লয়ালটি ম্যানেজমেন্ট" loading="lazy" width={1280} height={800} className="w-full" />
              <div className="border-t bg-card px-4 py-2.5 text-sm font-medium">👥 কাস্টমার — বাকি, পয়েন্ট আর লয়ালটি</div>
            </div>
            <div className="overflow-hidden rounded-2xl border shadow-card">
              <img src={shotInventory} alt="ইনভেন্টরি — স্টক লেভেল ও কম স্টকের অ্যালার্ট" loading="lazy" width={1280} height={800} className="w-full" />
              <div className="border-t bg-card px-4 py-2.5 text-sm font-medium">📦 ইনভেন্টরি — স্টক আর কম স্টকের অ্যালার্ট</div>
            </div>
          </div>
          <div className="mx-auto w-full max-w-[280px] overflow-hidden rounded-3xl border-4 border-border shadow-card lg:mt-6">
            <img src={shotPosMobile} alt="মোবাইলে POS — ফোন থেকেই বিক্রি" loading="lazy" width={560} height={1212} className="w-full" />
            <div className="border-t bg-card px-4 py-2.5 text-center text-sm font-medium">📱 ফোনেও একই সফটওয়্যার</div>
          </div>
        </div>
        <DemoButton label="এই সফটওয়্যারের ডেমো দেখতে চাই" />
      </section>

      {/* Products photo + trust */}
      <section className="border-y bg-secondary/50">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div className="order-2 md:order-1">
              <h2 className="font-display text-2xl font-bold md:text-4xl">আপনি বিক্রি আর কাস্টমারে মন দিন — হিসাবের দায়িত্ব আমাদের</h2>
              <p className="mt-4 text-muted-foreground">
                দোকানের আসল কাজ হলো ভালো পণ্য আর ভালো সেবা। কিন্তু হিসাবের চাপে
                সেখানে মন বসে না। Business Manager Pro আপনার হিসাবের পুরো বোঝা নিয়ে নেয় —
                আপনি ফিরে পান আপনার সময় আর মানসিক শান্তি।
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                {[
                  { icon: Clock, t: "দিনে ২-৩ ঘণ্টা বাঁচবে" },
                  { icon: ShieldCheck, t: "ডেটা ১০০% নিরাপদ" },
                  { icon: BadgeCheck, t: "১ বছর ফ্রি সাপোর্ট" },
                  { icon: PhoneCall, t: "সরাসরি WhatsApp সহায়তা" },
                ].map((x) => (
                  <div key={x.t} className="flex items-center gap-2.5 rounded-lg border bg-card p-3 text-sm font-medium shadow-card">
                    <x.icon className="size-5 shrink-0 text-primary" /> {x.t}
                  </div>
                ))}
              </div>
            </div>
            <img src={productsImg} alt="বিভিন্ন পণ্যের ফ্ল্যাট-লে ছবি" loading="lazy" width={1024} height={1024} className="order-1 w-full rounded-2xl object-cover shadow-card md:order-2" />
          </div>
          <DemoButton />
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
        <h2 className="text-center font-display text-2xl font-bold md:text-4xl">মাত্র ৩ ধাপে শুরু করুন</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="relative rounded-xl border bg-card p-6 text-center shadow-card">
              <span className="mx-auto grid size-12 place-items-center rounded-full bg-brand font-display text-xl font-bold text-primary-foreground">{s.n}</span>
              <h3 className="mt-4 font-semibold">{s.t}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
        <DemoButton />
      </section>

      {/* Pricing */}
      <section className="border-y bg-sidebar text-sidebar-foreground">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center md:px-6 md:py-24">
          <p className="inline-flex items-center gap-2 rounded-full bg-sidebar-accent px-4 py-1.5 text-xs font-semibold md:text-sm">
            <Sparkles className="size-4" /> সীমিত সময়ের অফার
          </p>
          <h2 className="mt-5 font-display text-2xl font-bold md:text-4xl">একবারের বিনিয়োগ, সারা বছরের শান্তি</h2>
          <div className="mx-auto mt-8 max-w-md rounded-2xl border border-sidebar-border bg-sidebar-accent p-8">
            <p className="text-sm font-medium opacity-80">সম্পূর্ণ প্যাকেজ</p>
            <p className="mt-2 font-display text-5xl font-bold text-sidebar-primary">৳৯,৯৯৯</p>
            <p className="mt-1 text-sm opacity-70">এককালীন · ১ বছর ফ্রি সাপোর্ট</p>
            <ul className="mt-6 space-y-2.5 text-left">
              {checks.map((c) => (
                <li key={c} className="flex items-start gap-2.5 text-sm">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-sidebar-primary" /> {c}
                </li>
              ))}
            </ul>
            <Button asChild size="lg" className="mt-7 w-full gap-2 bg-sidebar-primary text-sidebar-primary-foreground hover:opacity-90">
              <a href={WA} target="_blank" rel="noreferrer"><MessageCircle className="size-5" /> এখনই ডেমো চান — WhatsApp</a>
            </Button>
            <p className="mt-3 text-xs opacity-60">আজ মেসেজ দিলে বিশেষ ছাড়ের সুযোগ থাকতে পারে</p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-4xl px-4 py-16 text-center md:px-6 md:py-24">
        <h2 className="font-display text-2xl font-bold md:text-4xl">আপনার প্রতিযোগীরা ইতিমধ্যে ডিজিটাল — আপনি কতক্ষণ অপেক্ষা করবেন?</h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          প্রতিদিন দেরি মানে হিসাবের গোলমিল আরও বাড়ছে। আজই একটা মেসেজ দিন —
          ডেমো দেখতে কোনো টাকা লাগে না, কোনো বাধ্যবাধকতাও নেই।
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="gap-2 bg-success text-success-foreground hover:bg-success/90">
            <a href={WA} target="_blank" rel="noreferrer"><MessageCircle className="size-5" /> WhatsApp: +880 1792-490604</a>
          </Button>
          <Button asChild size="lg" variant="outline"><Link to="/auth">ফ্রি ট্রায়াল শুরু করুন</Link></Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-secondary/50">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-8 text-center text-sm text-muted-foreground md:px-6">
          <div className="flex items-center gap-2 font-display font-semibold text-foreground">
            <span className="grid size-8 place-items-center rounded-lg bg-brand text-primary-foreground"><Store className="size-4" /></span>
            Business Manager Pro
          </div>
          <p>আপনার ব্যবসার বিশ্বস্ত ডিজিটাল সঙ্গী</p>
          <a href={WA} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline">
            <MessageCircle className="size-4" /> WhatsApp: +880 1792-490604
          </a>
        </div>
      </footer>
    </div>
  );
}
