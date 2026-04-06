import type { Metadata } from "next";
import { AuthProvider } from "@/components/auth-provider";
import { I18nProvider } from "@/components/i18n-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tasko",
  description: "Responsive frontend for the Tasko service marketplace."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <I18nProvider>
          <AuthProvider>{children}</AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
