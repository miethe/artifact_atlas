import "./globals.css";

export const metadata = {
  title: "Artifact Atlas",
  description: "Project asset graph, Artifact BOM, and context-pack builder",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
