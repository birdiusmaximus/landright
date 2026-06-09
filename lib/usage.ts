// Per-subscriber monthly generation cap. Each "Make it land" / "Two more" counts
// as one. Stored in Clerk private metadata (no database needed):
//   privateMetadata = { genPeriod: "2026-07", genCount: 12 }
// Resets automatically when the calendar month (UTC) rolls over.
import { clerkClient } from "@clerk/nextjs/server";
import { isAdminUser } from "@/lib/admin";

export const MONTHLY_GENERATION_LIMIT = Number(process.env.MONTHLY_GENERATION_LIMIT ?? 50);

function currentPeriod(d = new Date()): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** First day of next month (UTC) as ISO — for the "resets on …" message. */
export function nextResetISO(d = new Date()): string {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1)).toISOString();
}

export interface UsageResult {
  allowed: boolean;
  used: number;
  limit: number;
  resetsAt: string; // ISO date the count resets
}

/**
 * Read + increment the caller's monthly generation count. Admins are uncapped.
 * Fails OPEN: if Clerk is briefly unreachable we allow the generation rather than
 * block a paying customer over a telemetry write (this is a soft cost cap, not a
 * security control).
 */
export async function recordGeneration(userId: string): Promise<UsageResult> {
  const limit = MONTHLY_GENERATION_LIMIT;
  const resetsAt = nextResetISO();
  if (isAdminUser(userId)) return { allowed: true, used: 0, limit, resetsAt };

  try {
    const cc = await clerkClient();
    const user = await cc.users.getUser(userId);
    const meta = (user.privateMetadata ?? {}) as { genPeriod?: string; genCount?: number };
    const period = currentPeriod();
    const used = meta.genPeriod === period ? meta.genCount ?? 0 : 0;

    if (used >= limit) return { allowed: false, used, limit, resetsAt };

    await cc.users.updateUserMetadata(userId, {
      privateMetadata: { ...meta, genPeriod: period, genCount: used + 1 },
    });
    return { allowed: true, used: used + 1, limit, resetsAt };
  } catch {
    return { allowed: true, used: 0, limit, resetsAt }; // fail open
  }
}
