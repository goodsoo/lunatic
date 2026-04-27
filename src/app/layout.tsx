import type { Metadata } from "next";
import { Big_Shoulders, Inter, Vollkorn } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "./_components/SiteHeader";
import { SiteFooter } from "./_components/SiteFooter";

const bigShoulders = Big_Shoulders({
  subsets: ["latin"],
  weight: ["900"],
  variable: "--font-display-en",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body-en",
});

const vollkorn = Vollkorn({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-logo-serif",
});

export const metadata: Metadata = {
  title: "Real Lunatic — KAIST Street Dance Crew",
  description: "KAIST 스트릿 댄스 동아리 Real Lunatic. 9 장르, 한 크루.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${bigShoulders.variable} ${inter.variable} ${vollkorn.variable} h-full antialiased`}
    >
      <body className="font-body min-h-full">
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
