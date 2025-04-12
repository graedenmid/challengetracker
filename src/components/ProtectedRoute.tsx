"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createBrowserClient();

  useEffect(() => {
    const checkAuth = async () => {
      console.log("ProtectedRoute: Checking authentication");

      const {
        data: { session },
      } = await supabase.auth.getSession();

      console.log("ProtectedRoute: Session exists:", !!session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (!session) {
        console.log("ProtectedRoute: No session found, redirecting to login");
        router.push("/auth/login");
      }
    };

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log(
        "ProtectedRoute: Auth state changed, session exists:",
        !!session
      );
      setUser(session?.user ?? null);
      if (!session) {
        console.log("ProtectedRoute: Session ended, redirecting to login");
        router.push("/auth/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
