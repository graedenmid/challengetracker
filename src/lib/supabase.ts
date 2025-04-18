import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

// Define a custom type that includes TOKEN_REFRESH_FAILURE for type checking
type ExtendedAuthChangeEvent = AuthChangeEvent | "TOKEN_REFRESH_FAILURE";

// For server-side usage
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);

// Use a more resilient singleton pattern that survives HMR
const isBrowser = typeof window !== "undefined";
const isDev = process.env.NODE_ENV === "development";

// Store client in global space to survive HMR
const getGlobalBrowserClient = () => {
  if (isBrowser) {
    // @ts-ignore - this is safe in the browser
    window.__supabaseBrowserClient = window.__supabaseBrowserClient || null;
    // @ts-ignore
    return window.__supabaseBrowserClient;
  }
  return null;
};

const setGlobalBrowserClient = (client: any) => {
  if (isBrowser) {
    // @ts-ignore - this is safe in the browser
    window.__supabaseBrowserClient = client;
  }
};

// Auth state management with HMR protection
let lastAuthCheck = 0;
let cachedSession: any = null;
// More aggressive throttling in development
const MIN_AUTH_CHECK_INTERVAL = isDev ? 30000 : 5000; // 30 seconds in dev, 5 in prod

// Track refresh token status to prevent loops
let refreshTokenFailed = false;

// For tracking and cleaning up subscriptions
const activeSubscriptions = new Set<{ unsubscribe: () => void }>();

// Helper function to create client component client with HMR protection
export const createBrowserClient = () => {
  // Check global space first (survives HMR)
  let client = getGlobalBrowserClient();

  if (!client) {
    // Create new client
    client = createClientComponentClient();

    // Store in global space
    setGlobalBrowserClient(client);

    // Initialize session cache from localStorage
    if (isBrowser) {
      try {
        const localAuthCache = localStorage.getItem("supabase_auth_cache");
        if (localAuthCache) {
          const { timestamp, refreshFailed } = JSON.parse(localAuthCache);
          // Only use cache if it's recent
          if (Date.now() - timestamp < 1000 * 60 * 5) {
            // 5 minutes
            lastAuthCheck = timestamp;
            refreshTokenFailed = refreshFailed;
          }
        }
      } catch (e) {
        console.log("Error reading auth cache", e);
      }
    }
  }

  return client;
};

// Store auth state in localStorage to survive page reloads
const updateAuthCache = () => {
  if (isBrowser) {
    try {
      localStorage.setItem(
        "supabase_auth_cache",
        JSON.stringify({
          timestamp: lastAuthCheck,
          refreshFailed: refreshTokenFailed,
        })
      );
    } catch (e) {
      console.log("Error saving auth cache", e);
    }
  }
};

// Throttled session getter to prevent excessive auth requests
export const getSessionSafely = async () => {
  const now = Date.now();

  // Return cached session if we checked recently (much longer in dev mode)
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
  updateAuthCache();

  try {
    const client = createBrowserClient();

    // In development, manually check if we have a session without auto-refresh
    if (isDev) {
      // Get from localStorage to avoid triggering refresh
      try {
        const json = localStorage.getItem("supabase.auth.token");
        if (json) {
          const { currentSession } = JSON.parse(json);
          if (currentSession) {
            // Simple expiry check
            const expiresAt = currentSession.expires_at;
            if (expiresAt && expiresAt * 1000 > Date.now()) {
              cachedSession = currentSession;
              return { data: { session: currentSession } };
            } else {
              // Expired - prevent refresh attempts
              refreshTokenFailed = true;
              updateAuthCache();
              return { data: { session: null } };
            }
          }
        }
      } catch (e) {
        console.log("Error reading auth token from localStorage", e);
      }
    }

    // Standard flow - only if needed
    const response = await client.auth.getSession();
    cachedSession = response.data.session;
    updateAuthCache();
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
      updateAuthCache();
    }

    return { data: { session: null }, error };
  }
};

// Clean up any existing subscription before creating a new one
const cleanupExistingSubscriptions = () => {
  activeSubscriptions.forEach((sub) => {
    try {
      sub.unsubscribe();
    } catch (e) {
      // Ignore errors during cleanup
    }
  });
  activeSubscriptions.clear();
};

// Limit to one subscription with proper HMR cleanup
export const getAuthSubscription = (
  callback: (event: AuthChangeEvent, session: any) => void
) => {
  const client = createBrowserClient();

  // Clean up existing subscriptions first (important for HMR)
  cleanupExistingSubscriptions();

  // Create a new subscription
  const { data } = client.auth.onAuthStateChange(
    (event: AuthChangeEvent, session: Session | null) => {
      // Update cached session
      cachedSession = session;
      lastAuthCheck = Date.now();
      updateAuthCache();

      // Track token refresh failures
      // Use type assertion since Supabase types don't include TOKEN_REFRESH_FAILURE
      if ((event as ExtendedAuthChangeEvent) === "TOKEN_REFRESH_FAILURE") {
        refreshTokenFailed = true;
        cachedSession = null;
        updateAuthCache();
      }

      // Trigger callback
      callback(event, session);
    }
  );

  // Track for cleanup
  activeSubscriptions.add(data.subscription);

  return { data };
};
