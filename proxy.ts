import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";
import { isAdminUser, AUTH_DISABLED } from "@/lib/admin";

// Next.js 16 renamed the `middleware` convention to `proxy` (nodejs runtime).
//
// Billing/login ON — clerkMiddleware() keeps Clerk's session fresh and enables
// `await auth()` in server code, and runs the acquisition funnel:
//   • anonymous visitor on "/"          → /onboarding (the marketing pitch)
//   • signed-in visitor on "/onboarding" → /            (skip the funnel)
const clerkFunnel = clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const path = req.nextUrl.pathname;

  if (!userId && path === "/") {
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }
  if (userId && path === "/onboarding" && !isAdminUser(userId)) {
    return NextResponse.redirect(new URL("/", req.url));
  }
});

// Billing/login OFF (the free web app) — no Clerk at all. We still show the
// onboarding once: a first-time visitor to "/" is sent to /onboarding, and a
// cookie set when they enter the app (onboarding's finish()) stops the redirect
// thereafter. (Also used by the dev preview, which can't reach clerk.accounts.dev.)
function freeFunnel(req: NextRequest) {
  if (req.nextUrl.pathname === "/" && !req.cookies.get("lr_seen_onboarding")) {
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }
  return NextResponse.next();
}

export default AUTH_DISABLED ? freeFunnel : clerkFunnel;

export const config = {
  matcher: [
    // Run on everything except Next.js internals and static files…
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // …and always run on API/TRPC routes and Clerk's auto-proxy path.
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
