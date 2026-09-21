import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { PUBLISH_STAMP } from "@/version";
import appCss from "../styles.css?url";

const APP_NAME = "KEYLINE";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: APP_NAME },
      { name: "theme-color", content: "#0B0C0E" },
      { name: "keyline-build", content: PUBLISH_STAMP },
      {
        name: "description",
        content: "Walk a real city. Light lamps. Answer trivia.",
      },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      // Stable path first: /assets/styles-*.css was CDN-404-poisoned for a year.
      ...(import.meta.env.PROD
        ? [{ rel: "stylesheet" as const, href: `/keyline.css?v=${PUBLISH_STAMP}` }]
        : []),
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;800&family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,400;1,9..144,600&display=swap",
      },
    ],
  }),
  component: () => (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <PreviewHostBridge />
        <svg width="0" height="0" aria-hidden className="absolute overflow-hidden" style={{ position: "absolute" }}>
          <filter id="keyline-chroma" colorInterpolationFilters="sRGB">
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0.55 -1.15 0.55 0 -0.06"
              result="mag"
            />
            <feComponentTransfer in="mag" result="cut">
              <feFuncA type="linear" slope="18" intercept="0" />
            </feComponentTransfer>
            <feComposite in="SourceGraphic" in2="cut" operator="out" />
          </filter>
        </svg>
        <AuthProvider>
          <Outlet />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
});
