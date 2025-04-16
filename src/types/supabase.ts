// Supabase custom types for TypeScript support
import { AuthChangeEvent } from "@supabase/supabase-js";

// Re-export auth events including TOKEN_REFRESH_FAILURE
export type ExtendedAuthChangeEvent = AuthChangeEvent | "TOKEN_REFRESH_FAILURE";
