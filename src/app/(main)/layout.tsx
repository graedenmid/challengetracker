"use client";

import Layout from "@/components/layout/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}
