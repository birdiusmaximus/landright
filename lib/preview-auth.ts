"use client";

// Auth surface for the onboarding flow.
//
// When AUTH_DISABLED (the free web app, or the dev preview) Clerk is not mounted,
// so we return inert stubs and never call Clerk's hooks. AUTH_DISABLED is a
// build-time constant, so the branch (and thus the hook-call order) is stable
// for the lifetime of the app; the real branch always calls the same hooks.
import { useUser, useClerk } from "@clerk/nextjs";
import { AUTH_DISABLED } from "@/lib/admin";

type RedirectOpts = { forceRedirectUrl?: string };

export type PreviewSafeAuth = {
  isSignedIn: boolean;
  user: { id: string; primaryEmailAddress?: { emailAddress?: string } | null } | null;
  openSignIn: (opts?: RedirectOpts) => void;
  openSignUp: (opts?: RedirectOpts) => void;
};

export function usePreviewSafeAuth(): PreviewSafeAuth {
  if (AUTH_DISABLED) {
    return { isSignedIn: false, user: null, openSignIn: () => {}, openSignUp: () => {} };
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { isSignedIn, user } = useUser();
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const clerk = useClerk();
  return {
    isSignedIn: !!isSignedIn,
    user: user ?? null,
    openSignIn: (opts) => clerk.openSignIn(opts),
    openSignUp: (opts) => clerk.openSignUp(opts),
  };
}
