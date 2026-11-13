import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { supabase } from "@/integrations/supabase/client";
import { AppearanceProvider } from "@/components/appearance-provider";

function NotFoundComponent() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="glass-card max-w-md p-10 text-center">
        <div className="font-display text-7xl text-gradient">404</div>
        <h2 className="mt-3 font-display text-2xl text-foreground">Lost in the clouds</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This page drifted away. Let's find your way home.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-glow transition hover:opacity-90"
          >
            Return home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="glass-card max-w-md p-10 text-center">
        <h1 className="font-display text-2xl">Something soft went sideways</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Take a breath — try again or head home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-glow"
          >
            Try again
          </button>
          <a href="/" className="rounded-full border border-border bg-card/60 px-5 py-2.5 text-sm">
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Inkora — A peaceful place to journal, reflect & grow" },
      {
        name: "description",
        content:
          "Open your enchanted diary. Journal privately, track gratitude, plan gently, and watch your inner garden bloom.",
      },
      { property: "og:title", content: "Inkora — A peaceful place to journal, reflect & grow" },
      {
        property: "og:description",
        content: "Open your enchanted diary. Journal privately, track gratitude, plan gently, and watch your inner garden bloom.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#f9c9de" },
      { name: "twitter:title", content: "Inkora — A peaceful place to journal, reflect & grow" },
      { name: "twitter:description", content: "Open your enchanted diary. Journal privately, track gratitude, plan gently, and watch your inner garden bloom." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/eb69a6f3-d6d2-4197-a00b-5a4e5033b4f9/id-preview-cddc171f--1f78396a-a0e1-4cdf-917f-6eeef7981adb.lovable.app-1785748935154.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/eb69a6f3-d6d2-4197-a00b-5a4e5033b4f9/id-preview-cddc171f--1f78396a-a0e1-4cdf-917f-6eeef7981adb.lovable.app-1785748935154.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=Cormorant+Garamond:ital,wght@1,400;1,500&family=Inter:wght@400;500;600;700&family=Poppins:wght@500;600&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => sub.subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <AppearanceProvider>
        <Outlet />
        <Toaster position="top-center" richColors />
      </AppearanceProvider>
    </QueryClientProvider>
  );
}
