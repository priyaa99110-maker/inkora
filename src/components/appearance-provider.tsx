import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  applyAppearance,
  appearanceFromProfile,
  DEFAULT_APPEARANCE,
  readStoredAppearance,
  storeAppearance,
  type Appearance,
} from "@/lib/theme";

type Ctx = {
  appearance: Appearance;
  /** Applies instantly (and persists locally). Pass persist=true to also save to the profile. */
  setAppearance: (patch: Partial<Appearance>, persist?: boolean) => void;
};

const AppearanceContext = createContext<Ctx>({
  appearance: DEFAULT_APPEARANCE,
  setAppearance: () => {},
});

export const useAppearance = () => useContext(AppearanceContext);

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const [appearance, setLocal] = useState<Appearance>(DEFAULT_APPEARANCE);
  const hydrated = useRef(false);

  // Hydrate from localStorage first (instant), then reconcile with the profile.
  useEffect(() => {
    const stored = readStoredAppearance();
    setLocal(stored);
    applyAppearance(stored);
    hydrated.current = true;

    let cancelled = false;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user || cancelled) return;
      const { data } = await supabase
        .from("profiles")
        .select("theme, accent_color, dark_mode, font_family, font_scale, letter_spacing, line_spacing, custom_colors")
        .eq("id", u.user.id)
        .maybeSingle();
      if (!data || cancelled) return;
      const next = appearanceFromProfile(data);
      setLocal(next);
      applyAppearance(next);
      storeAppearance(next);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setAppearance = useCallback(
    (patch: Partial<Appearance>, persist = false) => {
      setLocal((prev) => {
        const next = { ...prev, ...patch };
        applyAppearance(next);
        storeAppearance(next);
        if (persist) {
          void (async () => {
            const { data: u } = await supabase.auth.getUser();
            if (!u.user) return;
            await supabase
              .from("profiles")
              .update({
                theme: next.theme,
                accent_color: next.accent || null,
                dark_mode: next.dark,
                font_family: next.font,
                font_scale: next.scale,
                letter_spacing: next.letterSpacing,
                line_spacing: next.lineSpacing,
                custom_colors: next.colors,
              })
              .eq("id", u.user.id);
          })();
        }
        return next;
      });
    },
    [],
  );

  return (
    <AppearanceContext.Provider value={{ appearance, setAppearance }}>
      {children}
    </AppearanceContext.Provider>
  );
}
