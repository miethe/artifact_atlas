import "./globals.css";
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Providers } from "./providers";
import { isFlagEnabled } from "@/lib/flags";
import { THEME_STORAGE_KEY } from "@/lib/theme";

// DM-4 no-FOUC script: resolves the stored theme preference (default
// "system") to a concrete data-theme before first paint. THEME_STORAGE_KEY
// is inlined at build time; keep lib/theme.ts's resolution logic in sync.
// MINOR fix: the stored value is validated against the light|dark|system
// allow-list before use — an unexpected/corrupted/tampered localStorage
// value (anything else) is treated as "system" instead of being assigned
// straight to data-theme.
const noFoucThemeScript = `(function(){try{var k=${JSON.stringify(
  THEME_STORAGE_KEY,
)};var p=localStorage.getItem(k);if(p!=="light"&&p!=="dark"&&p!=="system"){p="system";}var d=p==="system"?(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):p;document.documentElement.dataset.theme=d;}catch(e){}})();`;

const fontSans = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: {
    default: "Artifact Atlas",
    template: "%s | Artifact Atlas",
  },
  description: "Project asset graph, Artifact BOM, and context-pack builder",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fontSans.variable} ${fontMono.variable}`}
    >
      <head>
        {isFlagEnabled("dark-mode") && (
          // eslint-disable-next-line @next/next/no-sync-scripts
          <script dangerouslySetInnerHTML={{ __html: noFoucThemeScript }} />
        )}
      </head>
      <body className="bg-[var(--bg)] text-[var(--ink)] antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
