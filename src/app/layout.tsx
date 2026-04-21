import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Ingrid Simmenæs Borten · Malerier og smykker",
    template: "%s · Ingrid Simmenæs Borten",
  },
  description:
    "Norsk kunstner: ekspressive malerier og håndlavede smykker med nordisk ro.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="da"
      className={`${playfair.variable} ${inter.variable} h-full scroll-smooth`}
    >
      <body className={`min-h-full antialiased ${inter.className}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
