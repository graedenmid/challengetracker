import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { AuthChangeEvent } from "@supabase/supabase-js";

// For server-side usage
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);

// Use a singleton pattern to prevent multiple browser clients
let browserClient: ReturnType<typeof createClientComponentClient> | null = null;

// Auth state management
let lastAuthCheck = 0;
let cachedSession: any = null;
const MIN_AUTH_CHECK_INTERVAL = 5000; // 5 seconds between auth checks

// Track refresh token status to prevent loops
let refreshTokenFailed = false;

// Helper function to create client component client with custom options
export const createBrowserClient = () => {
  if (!browserClient) {
    // Create client with default settings
    browserClient = createClientComponentClient();

    // Add listener to detect token refresh failures
    browserClient.auth.onAuthStateChange((event) => {
      if (event === "TOKEN_REFRESHED") {
        // Reset the flag if a refresh succeeds
        refreshTokenFailed = false;
      }

      // Using a type assertion for TOKEN_REFRESH_FAILURE which may not be in the type definition
      if (event === ("TOKEN_REFRESH_FAILURE" as AuthChangeEvent)) {
        refreshTokenFailed = true;
      }
    });
  }
  return browserClient;
};

// Throttled session getter to prevent excessive auth requests
export const getSessionSafely = async () => {
  const now = Date.now();

  // Return cached session if we checked recently
  if (
    now - lastAuthCheck < MIN_AUTH_CHECK_INTERVAL &&
    cachedSession !== undefined
  ) {
    return { data: { session: cachedSession } };
  }

  // Don't attempt to get session if we know refresh has failed
  if (refreshTokenFailed) {
    return { data: { session: null } };
  }

  // Update timestamp before making the request
  lastAuthCheck = now;

  try {
    const client = createBrowserClient();
    const response = await client.auth.getSession();
    cachedSession = response.data.session;
    return response;
  } catch (error: any) {
    console.error("Error getting session:", error);

    // Detect refresh token failures to prevent future attempts
    if (
      error.message &&
      (error.message.includes("refresh_token_not_found") ||
        error.message.includes("rate limit"))
    ) {
      console.log("Token refresh failed, disabling auto-refresh");
      refreshTokenFailed = true;
      cachedSession = null;
    }

    return { data: { session: null }, error };
  }
};

// Get a shared subscription for auth state changes
let globalAuthSubscription: { data: { subscription: any } } | null = null;

export const getAuthSubscription = (
  callback: (event: AuthChangeEvent, session: any) => void
) => {
  const client = createBrowserClient();

  if (!globalAuthSubscription) {
    globalAuthSubscription = client.auth.onAuthStateChange((event, session) => {
      // Update cached session
      cachedSession = session;
      lastAuthCheck = Date.now();

      // Track token refresh failures
      if (event === ("TOKEN_REFRESH_FAILURE" as AuthChangeEvent)) {
        refreshTokenFailed = true;
        cachedSession = null;
      }

      // Trigger callback
      callback(event, session);
    });
  }

  return globalAuthSubscription;
};
