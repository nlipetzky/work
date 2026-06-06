// Trust-critical core: pure, deterministic projection of a prospect's interaction
// history into CRM state. No I/O here so it stays unit-testable. Validate the v1 rules
// against real Rahr/Absolute data BEFORE trusting the auto-derive loop.

export type Stage =
  | "Identified"
  | "In Conversation"
  | "Meeting Booked"
  | "Met"
  | "Diagnostic"
  | "Proposal Sent"
  | "Won"
  | "Paused"
  | "Lost";

export type WaitingOn = "Us" | "Partner" | "Prospect" | null;

export interface Interaction {
  kind: "meeting" | "email";
  direction: "inbound" | "outbound" | null; // inbound = from the prospect
  date: string; // ISO
  label?: string; // subject / title, for the basis string
}

export interface DeriveInput {
  interactions: Interaction[];
  ownerIsPartner: boolean; // CRM Owner is a partner (Will/Larry) vs Nick
  proposalSent: boolean; // a proposal artifact has gone out
  manualStageLock?: Stage | null; // human override wins
  manualWaitingLock?: WaitingOn; // human override wins
}

export interface Derived {
  stage: Stage;
  waitingOn: WaitingOn;
  basis: string; // why we landed here — the auditable reason
}

// v1 rules. Coarse on purpose. Refine only after validating against reality.
export function derive(input: DeriveInput): Derived {
  const sorted = [...input.interactions].sort((a, b) => b.date.localeCompare(a.date));
  const latest = sorted[0];
  const hadMeeting = sorted.some((i) => i.kind === "meeting");

  // Stage
  let stage: Stage;
  let stageBasis: string;
  if (input.proposalSent) {
    stage = "Proposal Sent";
    stageBasis = "a proposal artifact has been sent";
  } else if (hadMeeting) {
    stage = "Diagnostic"; // met + working the assessment, pre-proposal
    stageBasis = "a meeting has occurred; in discovery";
  } else if (sorted.length > 0) {
    stage = "In Conversation";
    stageBasis = "active comms, no meeting yet";
  } else {
    stage = "Identified";
    stageBasis = "no interactions captured";
  }
  if (input.manualStageLock) {
    stage = input.manualStageLock;
    stageBasis = "manual lock (override)";
  }

  // Waiting On — whose court the ball is in.
  // External party we await => Prospect. Our side owes the move => resolve to owner.
  let waitingOn: WaitingOn;
  let waitBasis: string;
  if (!latest) {
    waitingOn = input.ownerIsPartner ? "Partner" : "Us";
    waitBasis = "no comms yet; initiator's court";
  } else if (latest.direction === "inbound") {
    waitingOn = input.ownerIsPartner ? "Partner" : "Us";
    waitBasis = `inbound ${latest.kind}${latest.label ? ` ("${latest.label}")` : ""} awaiting our reply`;
  } else if (latest.direction === "outbound") {
    waitingOn = "Prospect";
    waitBasis = `we sent the last ${latest.kind}${latest.label ? ` ("${latest.label}")` : ""}; awaiting them`;
  } else {
    waitingOn = input.ownerIsPartner ? "Partner" : "Us";
    waitBasis = `last ${latest.kind} has unknown direction; defaulting to our court`;
  }
  if (input.manualWaitingLock !== undefined && input.manualWaitingLock !== null) {
    waitingOn = input.manualWaitingLock;
    waitBasis = "manual lock (override)";
  }

  const basisDate = latest ? latest.date : "n/a";
  return { stage, waitingOn, basis: `${stageBasis}; ${waitBasis} [as of ${basisDate}]` };
}
