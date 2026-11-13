import { createFileRoute, Link } from "@tanstack/react-router";
import { DreamBackdrop } from "@/components/dream-backdrop";
import { BookHeart, ListChecks, Sparkles, Heart, Moon, Feather } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Inkora — A peaceful place to journal, reflect & grow" },
      {
        name: "description",
        content:
          "Open your enchanted diary. Journal privately, track gratitude, plan gently, and watch your inner garden bloom.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: BookHeart, title: "Private Diary", body: "A vintage notebook feel with autosave, moods, tags and daily prompts." },
  { icon: Heart, title: "Gratitude", body: "Bloom a garden of small joys. Daily prompts, streaks and gentle reviews." },
  { icon: ListChecks, title: "Gentle To-dos", body: "Plan today softly. Confetti and butterflies when your day is done." },
  { icon: Moon, title: "Mood Tracker", body: "Notice how you feel. Beautiful trends, no judgement." },
  { icon: Sparkles, title: "Reflect Nightly", body: "Prompts, wins, lessons — a calm ritual before you sleep." },
  { icon: Feather, title: "Yours only", body: "Encrypted-in-transit, private by default. Your words stay yours." },
];

function Landing() {
  return (
    <div className="relative min-h-dvh">
      <DreamBackdrop />

      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-primary/80 text-primary-foreground shadow-glow">
            <Feather className="h-4 w-4" />
          </span>
          <span className="font-display text-xl tracking-[0.2em] text-gradient">INKORA</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link
            to="/auth"
            className="rounded-full px-4 py-2 text-sm text-foreground/80 hover:text-foreground"
          >
            Sign in
          </Link>
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-glow transition hover:opacity-90"
          >
            Begin
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6">
        <section className="grid gap-10 py-16 md:grid-cols-2 md:items-center md:py-24">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Your peaceful sanctuary
            </span>
            <h1 className="mt-5 font-display text-5xl leading-[1.05] md:text-6xl">
              Open your <span className="text-gradient">enchanted diary</span>, one soft page at a time.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-muted-foreground">
              Inkora is a dreamy space to write, reflect, plan and grow — with floating clouds,
              gentle butterflies and quiet care for your inner world.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/auth"
                search={{ mode: "signup" }}
                className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-glow transition hover:-translate-y-0.5"
              >
                Start your journey
              </Link>
              <Link
                to="/auth"
                className="rounded-full border border-border bg-card/70 px-6 py-3 text-sm font-medium backdrop-blur transition hover:bg-card"
              >
                I have an account
              </Link>
            </div>
            <p className="mt-4 font-quote text-lg text-muted-foreground">
              “Write it on your heart that every day is the best day of the year.”
            </p>
          </div>

          <div className="relative animate-fade-up">
            <div className="glass-card p-6 md:p-8">
              <div className="mb-4 flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-blush" />
                <div className="h-2 w-2 rounded-full bg-lavender" />
                <div className="h-2 w-2 rounded-full bg-gold" />
                <span className="ml-auto text-xs text-muted-foreground">Today</span>
              </div>
              <h3 className="font-display text-2xl">A soft morning</h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground/80">
                Woke to birdsong outside my window. Coffee, a slow walk, and a promise to be
                kinder to myself today. Grateful for quiet mornings and the way the light lands
                on the sill.
              </p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs">
                {["#calm", "#grateful", "#morning"].map((t) => (
                  <span key={t} className="rounded-full bg-accent/60 px-2.5 py-1">{t}</span>
                ))}
              </div>
              <div className="mt-6 grid grid-cols-3 gap-3">
                <MiniStat label="Streak" value="12d" />
                <MiniStat label="Gratitude" value="34" />
                <MiniStat label="Mood" value="😌" />
              </div>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="mb-10 text-center">
            <h2 className="font-display text-3xl md:text-4xl">Everything you need, softly designed</h2>
            <p className="mt-3 text-muted-foreground">Made for calm days, cozy evenings and long-form thinking.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, body }) => (
              <div key={title} className="glass-card p-6 transition hover:-translate-y-1">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-xl">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="my-16">
          <div className="glass-card grid gap-6 p-10 text-center md:p-14">
            <h2 className="font-display text-3xl md:text-4xl">Step into your sanctuary</h2>
            <p className="mx-auto max-w-xl text-muted-foreground">
              Free while you're gently starting out. No noise, no ads — just you, your pages, and
              a slow-flying butterfly or two.
            </p>
            <div>
              <Link
                to="/auth"
                search={{ mode: "signup" }}
                className="inline-flex rounded-full bg-primary px-7 py-3 text-sm font-medium text-primary-foreground shadow-glow"
              >
                Create your journal
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-6xl px-6 pb-10 text-center text-xs text-muted-foreground">
        Inkora · Made with quiet care ✿
      </footer>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/50 p-3 text-center">
      <div className="font-display text-xl">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}
