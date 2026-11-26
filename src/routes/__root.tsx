import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { APP_VERSION, PUBLISH_STAMP, SHEET_HREF } from "@/version";
import appCss from "../styles.css?url";

const APP_NAME = "KEYLINE";
/** 0.1.193: the title street painting is the largest paint on the page but only appears once the app has hydrated, so
 * the browser found it seconds late. This reads the saved city the same way TitleScreen picks the skyline and asks for
 * the picture at once (a wrong guess costs one cached webp; the first visit gets the generic street). */
const TITLE_STREET_PRELOAD = `try{var s=JSON.parse(localStorage.getItem("keyline-save-v1")||"null"),k="generic";if(s&&s.cities&&s.cities.start&&(s.cityId==="chicago"||s.cityId==="nyc"||s.cityId==="sf"))k=s.cityId;var l=document.createElement("link");l.rel="preload";l.as="image";l.href="/title/street-"+k+".webp";l.setAttribute("fetchpriority","high");document.head.appendChild(l)}catch(e){}`;

const cssHref = import.meta.env.PROD ? `${SHEET_HREF}?v=${PUBLISH_STAMP}` : appCss;

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: `${APP_NAME} v${APP_VERSION}` },
      { name: "theme-color", content: "#0B0C0E" },
      { name: "keyline-build", content: PUBLISH_STAMP },
      { name: "keyline-sheet-src", content: String(appCss) },
      {
        name: "description",
        content: "Walk a real city. Open vaults. Answer trivia.",
      },
    ],
    scripts: [{ children: TITLE_STREET_PRELOAD }],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: cssHref },
      { rel: "stylesheet", href: `/hq-tabs.css?v=${PUBLISH_STAMP}` },
      { rel: "stylesheet", href: `/lantern-art.css?v=${PUBLISH_STAMP}` },
      { rel: "stylesheet", href: `/wardrobe.css?v=${PUBLISH_STAMP}` },
      { rel: "stylesheet", href: `/prop-art.css?v=${PUBLISH_STAMP}-i` },
      { rel: "stylesheet", href: `/coats.css?v=${PUBLISH_STAMP}` },
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
