import Layout from "@/components/layout/Layout";

interface HomeLayoutProps {
  children: React.ReactNode;
}

export default function HomeLayout({ children }: HomeLayoutProps) {
  return <Layout>{children}</Layout>;
}
