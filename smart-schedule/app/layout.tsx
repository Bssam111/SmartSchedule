import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { DialogProvider } from "@/components/DialogProvider";
import { ToastProvider } from "@/components/ToastProvider";

export const metadata: Metadata = {
  title: "SmartSchedule",
  description: "University Scheduling System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <DialogProvider>
            <ToastProvider>
            {children}
            </ToastProvider>
          </DialogProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

