"use client";

// Auth surface for the onboarding flow.
//
// In the dev preview window Clerk is not mounted — its dev-browser handshake
// redirects the page to clerk.accounts.dev, which the preview blocks — so we
// return inert stubs and never call Clerk's hooks. DEV_PREVIEW_BYPASS is a
// build-time constant, so the branch (and thus the hook-call order) is stable
// for the lifetime of the app; the real branch always calls the same hooks.
import { useUser, useClerk } from "@clerk/nextjs";
import { DEV_PREVIEW_BYPASS } from "@/lib/admin";

type RedirectOpts = { forceRedirectUrl?: string };

export type PreviewSafeAuth = {
  isSignedIn: boolean;
  user: { id: string; primaryEmailAddress?: { emailAddress?: string } | null } | null;
  openSignIn: (opts?: RedirectOpts) => void;
  openSignUp: (opts?: RedirectOpts) => void;
};

export function usePreviewSafeAuth(): PreviewSafeAuth {
  if (DEV_PREVIEW_BYPASS) {
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
