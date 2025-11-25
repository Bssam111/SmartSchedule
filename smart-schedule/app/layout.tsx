import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { DialogProvider } from "@/components/DialogProvider";

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
            {children}
          </DialogProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

