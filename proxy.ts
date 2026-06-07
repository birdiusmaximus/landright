import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isAdminUser, DEV_PREVIEW_BYPASS } from "@/lib/admin";

// Next.js 16 renamed the `middleware` convention to `proxy` (nodejs runtime).
// clerkMiddleware() enables `await auth()` in server components and route
// handlers and keeps Clerk's session cookies fresh on every request.
//
// It also runs the acquisition funnel:
//   • anonymous visitor on "/"          → /onboarding (the marketing pitch)
//   • signed-in visitor on "/onboarding" → /            (skip the funnel)
export default clerkMiddleware(async (auth, req) => {
  if (DEV_PREVIEW_BYPASS) return; // local preview: no funnel redirect, load the app directly
  const { userId } = await auth();
  const path = req.nextUrl.pathname;

  if (!userId && path === "/") {
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }
  if (userId && path === "/onboarding" && !isAdminUser(userId)) {
    return NextResponse.redirect(new URL("/", req.url));
  }
});

export const config = {
  matcher: [
    // Run on everything except Next.js internals and static files…
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // …and always run on API/TRPC routes and Clerk's auto-proxy path.
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
