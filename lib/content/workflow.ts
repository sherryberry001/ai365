import type { ContentStatus } from "@/lib/database.types";

/**
 * The content lifecycle state machine, shared by every content type:
 *
 *   idea → draft → review → approved → published → archived
 *
 * Backwards moves are allowed (e.g. review → draft on rejection) but you can
 * never skip straight to `published` without passing through `approved` —
 * which enforces the "human approval required before publication" rule.
 */
export const TRANSITIONS: Record<ContentStatus, ContentStatus[]> = {
  idea: ["draft", "archived"],
  draft: ["review", "idea", "archived"],
  review: ["approved", "draft", "archived"],
  approved: ["published", "review", "archived"],
  published: ["archived"],
  archived: ["draft"],
};

export function canTransition(
  from: ContentStatus,
  to: ContentStatus,
): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(
  from: ContentStatus,
  to: ContentStatus,
): void {
  if (!canTransition(from, to)) {
    throw new Error(`Illegal content transition: ${from} → ${to}`);
  }
}

/** The full ordered pipeline, for rendering kanban columns etc. */
export const PIPELINE: ContentStatus[] = [
  "idea",
  "draft",
  "review",
  "approved",
  "published",
];
