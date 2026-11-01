import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import "@fontsource-variable/inter";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "RelayDesk — BT Hizmet Yönetimi",
    template: "%s · RelayDesk",
  },
  description: "Olay, talep, varlık, bilgi ve değişiklik yönetimi.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
