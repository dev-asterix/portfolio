import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import CustomCursor from "@/components/ui/CustomCursor";
import { PROFILE } from "@/lib/profile";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const DESCRIPTION =
  `${PROFILE.name} — software engineer building high-throughput backends and developer tools ` +
  "like NexQL, the PostgreSQL workbench for VS Code. Explore the work in a browser-based desktop OS.";

export const metadata: Metadata = {
  metadataBase: new URL(PROFILE.siteUrl),
  title: {
    default: `${PROFILE.name} · asterix.dev`,
    template: `%s · asterix.dev`,
  },
  description: DESCRIPTION,
  authors: [{ name: PROFILE.name, url: PROFILE.siteUrl }],
  keywords: ["Richie Varghese", "dev-asterix", "NexQL", "PostgreSQL", "VS Code extension", "Go", "Rust", "TypeScript", "portfolio"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: PROFILE.siteUrl,
    siteName: "asterix.dev",
    title: `${PROFILE.name} · asterix.dev`,
    description: DESCRIPTION,
    images: [{ url: "/card.png", width: 1024, height: 1024, alt: "asterix.dev" }],
  },
  twitter: {
    card: "summary",
    title: `${PROFILE.name} · asterix.dev`,
    description: DESCRIPTION,
    images: ["/card.png"],
  },
  appleWebApp: { capable: true, title: "asterix.dev", statusBarStyle: "black-translucent" },
};

// No maximum-scale: blocking pinch-zoom fails WCAG 1.4.4 (Resize Text).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#09090b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* Restore data-theme before first paint to prevent FOUC */}
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                try {
                  var stored = localStorage.getItem('asterix-os-storage');
                  var theme = 'carbon';
                  var colorScheme = 'system';
                  if (stored) {
                    try {
                      var parsed = JSON.parse(stored);
                      // handle common persist shapes: { settings: {...} } or { state: { settings: {...} } }
                      var settings = (parsed && parsed.settings) || (parsed && parsed.state && parsed.state.settings) || (parsed && parsed.value && parsed.value.settings) || null;
                      if (settings) {
                        theme = settings.theme || theme;
                        colorScheme = settings.colorScheme || colorScheme;
                      }
                    } catch (e) {
                      // fallthrough
                    }
                  }

                  // fallback: next-themes may store a 'theme' key (e.g. 'dark'|'light'|'system')
                  try {
                    var nt = localStorage.getItem('theme');
                    if (nt && (nt === 'dark' || nt === 'light' || nt === 'system')) {
                      colorScheme = nt;
                    }
                  } catch(e){}

                  // apply accent theme
                  document.documentElement.setAttribute('data-theme', theme);

                  // Apply or remove .dark class before first paint based on persisted colorScheme
                  try {
                    if (colorScheme === 'dark') {
                      document.documentElement.classList.add('dark');
                    } else if (colorScheme === 'light') {
                      document.documentElement.classList.remove('dark');
                    } else {
                      var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                      if (prefersDark) document.documentElement.classList.add('dark');
                      else document.documentElement.classList.remove('dark');
                    }
                  } catch (e) {
                    // ignore
                  }
                } catch (e) {
                  try { document.documentElement.setAttribute('data-theme', 'carbon'); } catch (_) {}
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased selection:bg-cyan-glowing/30`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <CustomCursor />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
