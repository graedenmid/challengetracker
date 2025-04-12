"use client";

import Link from "next/link";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow-sm py-4">
        <div className="container mx-auto px-4">
          <Link href="/" className="flex items-center">
            <span className="text-2xl font-bold text-primary">
              Challenge Tracker
            </span>
          </Link>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center">
        {children}
      </main>

      <footer className="bg-white py-4 border-t border-gray-200">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Challenge Tracker. All rights
            reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
