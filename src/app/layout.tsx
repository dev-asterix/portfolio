import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import CustomCursor from "@/components/ui/CustomCursor";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "asterix.dev | Developer OS",
  description: "Modern minimalist portfolio",
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
