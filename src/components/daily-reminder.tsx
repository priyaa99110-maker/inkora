import { useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const FIRED_KEY = "pihu:reminder-fired";
const PERMISSION_KEY = "pihu:reminder-asked";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Gentle daily nudge based on the profile's reminder time.
 * Fires at most once per day, in-app toast plus a browser notification when allowed.
 */
export function DailyReminder() {
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | undefined;

    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user || cancelled) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("reminder_time, name")
        .eq("id", u.user.id)
        .maybeSingle();
      const time = profile?.reminder_time as string | null | undefined;
      if (!time || cancelled) return;

      const [h, m] = time.split(":").map(Number);
      if (Number.isNaN(h) || Number.isNaN(m)) return;

      if (
        typeof Notification !== "undefined" &&
        Notification.permission === "default" &&
        localStorage.getItem(PERMISSION_KEY) !== "1"
      ) {
        localStorage.setItem(PERMISSION_KEY, "1");
        void Notification.requestPermission().catch(() => undefined);
      }

      const check = () => {
        const now = new Date();
        const due = now.getHours() > h || (now.getHours() === h && now.getMinutes() >= m);
        if (!due) return;
        if (localStorage.getItem(FIRED_KEY) === todayKey()) return;
        localStorage.setItem(FIRED_KEY, todayKey());
        const body = "A quiet moment is waiting — write today's page ✿";
        toast("Journal reminder", { description: body });
        try {
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            new Notification("Inkora", { body });
          }
        } catch {
          /* notifications unsupported */
        }
      };

      check();
      timer = setInterval(check, 60_000);
    })();

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, []);

  return null;
}