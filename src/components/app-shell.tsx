import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Home,
  BookHeart,
  ListChecks,
  Heart,
  CalendarDays,
  Smile,
  Settings,
  LogOut,
  Feather,
  Menu,
  X,
  Shield,
  Trophy,
} from "lucide-react";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { DailyReminder } from "@/components/daily-reminder";
import { enforceSessionPolicy } from "@/lib/session-policy";
import { Button } from "@/components/ui/button";

const items = [
  { to: "/dashboard", icon: Home, label: "Dashboard" },
  { to: "/diary", icon: BookHeart, label: "Diary" },
  { to: "/search", icon: Search, label: "Search" },
  { to: "/todo", icon: ListChecks, label: "To-do" },
  { to: "/gratitude", icon: Heart, label: "Gratitude" },
  { to: "/mood", icon: Smile, label: "Mood" },
  { to: "/calendar", icon: CalendarDays, label: "Calendar" },
  { to: "/rewards", icon: Trophy, label: "Rewards" },
  { to: "/settings", icon: Settings, label: "Settings" },
] as const;

export function AppShell({ children, title }: { children: React.ReactNode; title?: string }) {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<{ name: string | null; avatar_url: string | null } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    (async () => {
      await enforceSessionPolicy();
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const [{ data }, { data: adminData }] = await Promise.all([
        supabase.from("profiles").select("name, avatar_url").eq("id", u.user.id).maybeSingle(),
        supabase.rpc("has_role", { _user_id: u.user.id, _role: "admin" }),
      ]);
      setProfile(data as any);
      setIsAdmin(!!adminData);
    })();
  }, []);

  const signOut = async () => {
    try {
      await qc.cancelQueries();
      qc.clear();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast("See you soon ✿");
      navigate({ to: "/auth", replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sign out failed. Please try again.");
    }
  };

  return (
    <div className="relative flex min-h-dvh">
      <DailyReminder />
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 shrink-0 border-r border-sidebar-border bg-sidebar backdrop-blur-xl transition-transform md:static md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center gap-2 px-5">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-primary/80 text-primary-foreground shadow-glow">
            <Feather className="h-4 w-4" />
          </span>
          <span className="font-display text-lg tracking-[0.18em] text-gradient">INKORA</span>
          <button className="ml-auto md:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="mt-2 flex flex-col gap-1 px-3">
          {items.map((it) => {
            const active = pathname === it.to || pathname.startsWith(it.to + "/");
            return (
              <Link
                key={it.to}
                to={it.to}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition ${
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-soft"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60"
                }`}
              >
                <it.icon className="h-4 w-4" />
                {it.label}
              </Link>
            );
          })}
          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition ${
                pathname.startsWith("/admin")
                  ? "bg-primary/20 text-primary shadow-soft"
                  : "text-primary/80 hover:bg-primary/10"
              }`}
            >
              <Shield className="h-4 w-4" />
              Admin
            </Link>
          )}
        </nav>
        <div className="absolute inset-x-3 bottom-3">
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent/60"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/60 bg-background/40 px-4 backdrop-blur-xl md:px-8">
          <button className="md:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="font-display text-xl md:text-2xl">{title}</h1>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground md:inline">
              Hello, {profile?.name?.split(" ")[0] ?? "friend"} ✿
            </span>
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" />
            ) : (
              <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/20 text-primary">
                {(profile?.name ?? "P").charAt(0)}
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              aria-label="Sign out"
              title="Sign out"
              className="text-muted-foreground hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
