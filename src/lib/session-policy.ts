import { supabase } from "@/integrations/supabase/client";

const REMEMBER_KEY = "pihu:remember-me";
const TAB_KEY = "pihu:tab-alive";

/** Records the user's "keep me signed in" choice at sign-in time. */
export function setRememberMe(remember: boolean) {
  try {
    localStorage.setItem(REMEMBER_KEY, remember ? "1" : "0");
    sessionStorage.setItem(TAB_KEY, "1");
  } catch {
    /* storage may be unavailable */
  }
}

/**
 * When "remember me" was off, the session must not survive a browser restart.
 * Supabase always persists to localStorage, so we sign out on the first load of
 * a brand-new browser session.
 */
export async function enforceSessionPolicy() {
  if (typeof window === "undefined") return;
  try {
    const remember = localStorage.getItem(REMEMBER_KEY) !== "0";
    const sameBrowserSession = sessionStorage.getItem(TAB_KEY) === "1";
    if (!remember && !sameBrowserSession) {
      const { data } = await supabase.auth.getSession();
      if (data.session) await supabase.auth.signOut();
      return;
    }
    sessionStorage.setItem(TAB_KEY, "1");
  } catch {
    /* storage may be unavailable */
  }
}