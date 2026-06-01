import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/neu-toast";
import { AnimatedBackground } from "@/components/ui/animated-background";
import MagicCursorClient from "@/components/ui/magic-cursor-client";
import { SidebarProvider } from "@/lib/SidebarContext";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AttendEase — Employee Attendance System",
  description:
    "Role-based employee attendance tracking system with check-in/check-out, admin dashboard, and detailed reports.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-black">
        <AnimatedBackground />
        <MagicCursorClient />
        <NextIntlClientProvider locale={locale} messages={messages}>
          <SidebarProvider>
            <ToastProvider>{children}</ToastProvider>
          </SidebarProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
