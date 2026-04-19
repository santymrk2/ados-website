import type { Metadata, Viewport } from "next";
import "@/app/globals.css";
import { BottomNav } from "@/components/ui/BottomNav";

export const metadata: Metadata = {
  title: "Activados",
  description: "App de gestión de actividades",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Activados",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    images: ["/logo.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#4342FF",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="pb-safe">
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
