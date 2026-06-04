import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Smart Project",
  description: "A smart project and task collaboration system.",
};

import StoreProvider from "@/store/StoreProvider";
import { NotificationProvider } from "@/contexts/NotificationContext";
import NextTopLoader from "nextjs-toploader";

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NextTopLoader
          color="#6366f1"
          showSpinner={false}
          shadow="0 0 10px #6366f1,0 0 5px #6366f1"
        />
        <StoreProvider>
          <NotificationProvider>{children}</NotificationProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
