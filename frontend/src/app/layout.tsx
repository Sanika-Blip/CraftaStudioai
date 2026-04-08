import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/theme-provider";

const nbArchitekt = localFont({
  src: [
    {
      path: "../../public/fonts/NBArchitekt-Regular.woff2",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-nb-architekt",
});

export const metadata: Metadata = {
  title: "CraftaStudio",
  description: "CraftaStudio production dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${nbArchitekt.variable} font-sans antialiased min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
