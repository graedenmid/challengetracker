import type { Metadata } from "next";
import "./globals.css";
import Layout from "@/components/layout/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";

export const metadata: Metadata = {
  title: "Challenge Tracker",
  description: "Track your personal challenges and goals",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  const isAuthPage = (path: string) => {
    return path.startsWith("/auth/");
  };

  // We would normally use usePathname here, but this is a server component
  // so we'll check the URL in the client components (Layout and ProtectedRoute)

  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&family=Open+Sans:wght@400;500;600;700&display=swap"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className="bg-gray-50 text-gray-700 min-h-full font-sans">
        {children}
      </body>
    </html>
  );
}
