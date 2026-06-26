// Client-safe shared types + constants for the system-building system (the /build console).
// NO "server-only" here on purpose: both the server read/write layer and the client BuildSurface
// import this. Keep it pure data — no canon client, no secrets.

export type Move = 1 | 2 | 3 | 4;
export type BuildStatus = "in_flight" | "blocked" | "done";
export type PendingAskType = "ratify_brief" | "react_sketch" | "trust_slice" | "confirm_capability";

export interface SystemBuild {
  slug: string;
  name: string;
  current_move: Move;
  status: BuildStatus;
  pending_ask_type: PendingAskType | null;
  pending_ask_text: string | null;
  brief_path: string | null;
  sketch_path: string | null;
  system_slug: string | null;
  notes: string | null;
  updated_at: string;
}

export const MOVES: Move[] = [1, 2, 3, 4];

// Plain operator-facing stage names. The surface speaks plainly; the methodology doc calls these
// the four "moves" (Brief, Sketch, the thin Slice, Grow). Stage 3 shows as "Proof" = see it work
// on real data.
export const MOVE_LABELS: Record<Move, string> = {
  1: "Brief",
  2: "Sketch",
  3: "Proof",
  4: "Grow",
};

// One plain line per stage, shown as the legend so the stage names explain themselves.
export const STAGE_HINTS: Record<Move, string> = {
  1: "agree what we're building",
  2: "agree what the screen shows",
  3: "see it work on real data",
  4: "expand it",
};

// The button label, by the current pending ask. Says plainly what clicking does.
export const ASK_VERB: Record<PendingAskType, string> = {
  ratify_brief: "Approve the brief",
  react_sketch: "Approve the sketch",
  trust_slice: "Confirm it works",
  confirm_capability: "Approve next step",
};

// What the NEXT stage's ask becomes when the current stage (the key) is approved.
// null = approving stage 4 completes the build.
export const NEXT_ASK: Record<Move, { type: PendingAskType; text: string } | null> = {
  1: { type: "react_sketch", text: "Look at the screen sketch and approve it." },
  2: { type: "trust_slice", text: "See it working on real data and confirm it's right." },
  3: { type: "confirm_capability", text: "Pick the next capability to add." },
  4: null,
};
