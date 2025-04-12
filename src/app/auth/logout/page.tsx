"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const handleSignOut = async () => {
      try {
        await supabase.auth.signOut();
        router.push("/auth/login");
      } catch (error) {
        console.error("Error signing out:", error);
        router.push("/auth/login");
      }
    };

    handleSignOut();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
        <h2 className="mt-6 text-center text-xl font-medium text-gray-900">
          Signing you out...
        </h2>
      </div>
    </div>
  );
}
