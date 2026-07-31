import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const pathname = request.nextUrl.pathname;

  // 1. Handle convenience redirects for singular/alternate routes
  if (pathname === "/stocks" || pathname === "/stock") {
    return NextResponse.redirect(new URL("/inventory", request.url));
  }
  if (pathname === "/volunteer") {
    return NextResponse.redirect(new URL("/volunteers", request.url));
  }
  if (pathname === "/shift") {
    return NextResponse.redirect(new URL("/shifts", request.url));
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  const protectedPaths = ["/dashboard", "/donations", "/inventory", "/volunteers", "/shifts"];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  // Redirect to login if user is not signed in
  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Redirect to dashboard if logged-in user attempts to access login page
  if (pathname === "/login" && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/donations/:path*",
    "/inventory/:path*",
    "/volunteers/:path*",
    "/shifts/:path*",
    "/login",
    "/stocks",
    "/stock",
    "/volunteer",
    "/shift",
  ],
};
