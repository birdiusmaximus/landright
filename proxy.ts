import { clerkMiddleware } from "@clerk/nextjs/server";

// Next.js 16 renamed the `middleware` convention to `proxy` (nodejs runtime).
// clerkMiddleware() is what enables `await auth()` in server components and
// route handlers, and keeps Clerk's session cookies fresh on every request.
export default clerkMiddleware();

export const config = {
  matcher: [
    // Run on everything except Next.js internals and static files…
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // …and always run on API/TRPC routes and Clerk's auto-proxy path.
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
