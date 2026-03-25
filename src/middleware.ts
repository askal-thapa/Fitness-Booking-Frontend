import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAuth = !!token;
    const { pathname } = req.nextUrl;

    // 1. If user is authenticated and tries to access login page, redirect to their dashboard
    if (isAuth && pathname === "/login") {
      if (token.role === "trainer") {
        return NextResponse.redirect(new URL("/trainer/dashboard", req.url));
      }
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // 2. Trainer-only routes
    if (isAuth && pathname.startsWith("/trainer") && token.role !== "trainer") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // 3. User-only routes (Dashboard and Onboarding)
    if (isAuth && (pathname.startsWith("/dashboard") || pathname === "/onboarding") && token.role !== "user") {
        if (token.role === "trainer") {
            return NextResponse.redirect(new URL("/trainer/dashboard", req.url));
        }
        return NextResponse.redirect(new URL("/login", req.url));
    }

    // 4. Onboarding logic for users ONLY
    if (isAuth && token.role === "user") {
        const onboardingCompleted = token.onboardingCompleted;
        
        // If user hasn't completed onboarding and isn't on the onboarding page, redirect to onboarding
        if (!onboardingCompleted && pathname !== "/onboarding") {
            return NextResponse.redirect(new URL("/onboarding", req.url));
        }
        
        // If user has completed onboarding and is on the onboarding page, redirect to dashboard
        if (onboardingCompleted && pathname === "/onboarding") {
            return NextResponse.redirect(new URL("/dashboard", req.url));
        }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // Public paths that don't require auth
        const publicPaths = ["/", "/login", "/trainers"];
        if (publicPaths.includes(pathname) || pathname.startsWith("/trainers/")) return true;
        
        // Require token for everything else
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/onboarding",
    "/trainer/:path*",
    "/login",
  ],
};
