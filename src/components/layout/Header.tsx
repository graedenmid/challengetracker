"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createBrowserClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserClient();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        console.log("Header: Fetching user session");
        const {
          data: { session },
        } = await supabase.auth.getSession();
        console.log("Header: Session exists:", !!session);
        setUser(session?.user || null);

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
          console.log("Header: Auth state changed, session exists:", !!session);
          setUser(session?.user || null);
        });

        return () => subscription.unsubscribe();
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [supabase]);

  // Navigation links configuration
  const navLinks = [
    { name: "Home", href: "/home" },
    { name: "Dashboard", href: "/challenges" },
    { name: "New Challenge", href: "/challenges/new" },
  ];

  // Check if a link is active
  const isActive = (path: string) => {
    return pathname === path || (path !== "/" && pathname?.startsWith(path));
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/auth/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <header className="bg-white shadow-sm py-4">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center">
            <span className="text-2xl font-bold text-primary">
              Challenge Tracker
            </span>
          </Link>
        </div>

        {/* Desktop navigation */}
        {!loading && (
          <nav className="hidden md:flex items-center space-x-6">
            {user ? (
              <>
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-sm font-medium transition-colors py-2 ${
                      isActive(link.href)
                        ? "text-primary border-b-2 border-primary"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}

                <button
                  onClick={handleSignOut}
                  className="btn-secondary text-sm"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <a
                  href="/auth/login"
                  data-testid="login-link"
                  className={`text-sm font-medium transition-colors py-2 ${
                    isActive("/auth/login")
                      ? "text-primary border-b-2 border-primary"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Login
                </a>
                <Link href="/auth/signup" className="btn-primary text-sm">
                  Sign Up
                </Link>
              </>
            )}
          </nav>
        )}

        {/* Mobile menu button */}
        <button
          type="button"
          className="md:hidden text-gray-500 hover:text-gray-700 focus:outline-none"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {isMobileMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16m-7 6h7"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile navigation */}
      {isMobileMenuOpen && (
        <nav className="md:hidden bg-white pt-4 pb-6 px-4 space-y-4 shadow-inner">
          {user ? (
            <>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block py-2 text-base font-medium ${
                    isActive(link.href)
                      ? "text-primary"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}

              <button
                onClick={() => {
                  handleSignOut();
                  setIsMobileMenuOpen(false);
                }}
                className="block w-full text-left py-2 text-base font-medium text-gray-600 hover:text-gray-900"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <a
                href="/auth/login"
                data-testid="mobile-login-link"
                className={`block py-2 text-base font-medium ${
                  isActive("/auth/login")
                    ? "text-primary"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Login
              </a>
              <Link
                href="/auth/signup"
                className={`block py-2 text-base font-medium ${
                  isActive("/auth/signup")
                    ? "text-primary"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Sign Up
              </Link>
            </>
          )}
        </nav>
      )}
    </header>
  );
}
