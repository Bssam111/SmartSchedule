import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "../components/AuthProvider";
import { NotificationProvider } from "../components/NotificationProvider";
import { DialogProvider } from "../components/DialogProvider";
import { Dialog } from "../components/Dialog";

export const metadata: Metadata = {
  title: "SmartSchedule",
  description: "Academic scheduling web app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body 
        className="min-h-screen bg-gray-50 text-gray-900 font-sans"
        suppressHydrationWarning={true}
      >
        <AuthProvider>
          <NotificationProvider>
            <DialogProvider>
              {children}
              <Dialog />
            </DialogProvider>
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
