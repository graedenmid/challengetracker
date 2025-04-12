import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

// For server-side usage
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);

// Helper function to create client component client
export const createBrowserClient = () => {
  return createClientComponentClient();
};
