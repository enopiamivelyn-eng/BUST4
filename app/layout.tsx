import type { Metadata } from "next";
import { AuthProvider } from "./components/AuthContext";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Bus Ticketing",
    template: "%s | Bus Ticketing",
  },
  description:
    "Book bus tickets online for Cebu, Bato, Oslob, Boljoon and Dalaguete. Manage reservations, view e-tickets and track your trips in one place.",
  icons: {
    icon: [{ url: "/BUSLOGO.png", sizes: "512x512", type: "image/png" }],
    apple: [{ url: "/BUSLOGO.png", sizes: "512x512", type: "image/png" }],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider
          realtimeConfig={{
            url: process.env.SUPABASE_URL || '',
            anonKey: process.env.SUPABASE_ANON_KEY || '',
          }}
        >
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
