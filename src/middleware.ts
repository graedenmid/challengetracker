import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  // Log the current URL path for debugging
  console.log(`Middleware processing: ${req.nextUrl.pathname}`);

  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  console.log(`Session exists: ${!!session}`);

  // Public routes that don't require authentication
  const publicPaths = ["/home", "/auth/login", "/auth/signup", "/"];

  // Check if the path starts with any of our explicitly excluded paths
  const isPublicPath = publicPaths.some(
    (path) =>
      req.nextUrl.pathname === path || req.nextUrl.pathname.startsWith("/auth/")
  );

  console.log(`Is public path: ${isPublicPath}`);

  // If there is no session and the user is trying to access a protected route
  if (!session && !isPublicPath) {
    console.log(`Redirecting to login from: ${req.nextUrl.pathname}`);
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/auth/login";
    redirectUrl.searchParams.set(`redirectedFrom`, req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
