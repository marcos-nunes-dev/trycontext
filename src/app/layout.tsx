import type { Metadata } from "next";
import { Geist, Instrument_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";
import { ThemeProvider } from "next-themes";
import { getServerUser, getServerSession } from "@/lib/auth/server";
import { Toaster } from "@/components/ui/toast";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Context - AI-Powered Product Management",
  description: "Transform product conversations into structured roadmaps",
};

export default async function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  const user = await getServerUser();
  const session = await getServerSession();

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${instrumentSans.variable} ${geist.variable} antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <AuthProvider initialUser={user} initialSession={session}>
            {children}
            {modal}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
