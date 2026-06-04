// CRM surface adapter (Airtable REST). Reads tracked prospects, writes derived state.
// Only synced fields are touched; manual locks are read, never overwritten.
import type { AccountKeys } from "./canon.js";
import type { WaitingOn } from "./derive.js";

const TOKEN = process.env.AIRTABLE_TOKEN!;
const BASE = process.env.AIRTABLE_BASE_ID!; // app5tsy6zjfA8H3rx
const PROSPECTS = "tblG44S3hYR5j5K2t";


const MOTIONS = "tblK83JY2FUj3zR31";
const MFIELD = {
  contact: "fld03PCg0244oEaiY",
  cycle: "fld9WPiftjxUJO7m0",
  motion: "fld70C0OmZoXy3q2o",
  waitingOn: "fldj7STA67yg2DwYu",
  nextAction: "fldNsUbaDDFEz19gR",
  nextActionDate: "fldzoXFlHec8DOvIQ",
  status: "fldjVAZQnHoviHJ5I",
  notes: "fldwS7UPznLD91GnW",
  canonDomain: "fld3izCsDlbggyCgv",
} as const;

const PARTNER_OWNERS = new Set(["Will", "Larry"]); // Nick = Us; others = Partner

// Motions uses a binary court: Them = the external counterparty; Us = our side
// (including when the ball is with our partner Will/Larry). Maps derive()'s 3-value output.
export function toBinaryWaitingOn(w: WaitingOn): "Us" | "Them" | null {
  if (w === "Prospect") return "Them";
  if (w === "Us" || w === "Partner") return "Us";
  return null;
}

// Writes derived Waiting On to a Motion row. Same guardrail as before: we do NOT write
// Stage/Motion — motion advancement stays human/Hermes-owned until the state-machine lands.
export async function updateMotionState(motionId: string, waitingOn: WaitingOn, basisNote: string) {
  void basisNote; // caller logs the basis
  const binary = toBinaryWaitingOn(waitingOn);
  if (!binary) return;
  await at(MOTIONS, {
    method: "PATCH",
    body: JSON.stringify({
      records: [{ id: motionId, fields: { [MFIELD.waitingOn]: binary } }],
      typecast: true,
    }),
  });
}

async function at(path: string, init?: RequestInit) {
  const r = await fetch(`https://api.airtable.com/v0/${BASE}/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  if (!r.ok) throw new Error(`Airtable ${r.status}: ${await r.text()}`);
  return r.json();
}


export interface TrackedMotion {
  motionId: string;
  contactId: string;
  company: string;
  ownerIsPartner: boolean;
  keys: AccountKeys;
}

// Projection source. One entry per motion row that carries a Canon Domain. Owner lives on the
// linked Contact, so we read Contacts once to resolve ownerIsPartner. Motions without a domain
// are skipped (we don't guess).
export async function listTrackedMotions(): Promise<TrackedMotion[]> {
  const [mData, pData] = await Promise.all([at(`${MOTIONS}?pageSize=100`), at(`${PROSPECTS}?pageSize=100`)]);
  const ownerById: Record<string, boolean> = {};
  const companyById: Record<string, string> = {};
  for (const rec of pData.records as any[]) {
    const owner = rec.fields["Owner"]?.name ?? rec.fields["Owner"] ?? "";
    ownerById[rec.id] = PARTNER_OWNERS.has(owner);
    companyById[rec.id] = rec.fields["Company"] ?? "";
  }
  const out: TrackedMotion[] = [];
  for (const rec of mData.records as any[]) {
    const f = rec.fields;
    const domain = f["Canon Domain"] || undefined;
    if (!domain) continue;
    const contactId = f["Contact"]?.[0];
    if (!contactId) continue;
    out.push({
      motionId: rec.id,
      contactId,
      company: companyById[contactId] ?? "",
      ownerIsPartner: ownerById[contactId] ?? false,
      keys: { domain },
    });
  }
  return out;
}

// --- Outbound drafts (Events table) ---
const EVENTS = "tbl3t6RkAPxouWWzj";
const EF = { status: "fld4TZQzkTITFlm6t", outcome: "fldCD21Xtxn1oz9wQ" } as const;

export interface Draft {
  id: string;
  subject: string;
  body: string;
  toEmail: string | null;
  from: string | null; // sender identity from the "Send As" field; null = use default
}

// Only Drafted + Outbound + Email + Approved-to-send. Recipient resolved from the linked Prospect.
export async function listApprovedDrafts(): Promise<Draft[]> {
  const data = await at(`${EVENTS}?pageSize=100`);
  const out: Draft[] = [];
  for (const rec of data.records as any[]) {
    const f = rec.fields;
    const status = f["Status"]?.name ?? f["Status"];
    const type = f["Type"]?.name ?? f["Type"];
    const dir = f["Direction"]?.name ?? f["Direction"];
    if (status !== "Drafted" || type !== "Email" || dir !== "Outbound" || f["Approved to send"] !== true) continue;
    let toEmail: string | null = f["To Email"] || null; // explicit recipient wins
    const prospectId = f["Prospect"]?.[0] ?? null;
    if (!toEmail && prospectId) {
      const p = await at(`${PROSPECTS}/${prospectId}`);
      toEmail = p.fields["Email"] || null;
    }
    const from = f["Send As"]?.name ?? f["Send As"] ?? null;
    out.push({ id: rec.id, subject: f["Subject"] ?? "", body: f["Raw Text"] ?? "", toEmail, from });
  }
  return out;
}

export async function markSent(eventId: string, gmailMessageId: string) {
  await at(EVENTS, {
    method: "PATCH",
    body: JSON.stringify({
      records: [{ id: eventId, fields: { [EF.status]: "Sent", [EF.outcome]: `Sent via Gmail (message id ${gmailMessageId})` } }],
      typecast: true,
    }),
  });
}

// --- Daily digest: contacts + their recent interactions ---
export interface ContactEvent { date: string; direction: string | null; subject: string }
export interface Contact {
  id: string;
  name: string;
  company: string;
  type: string | null;
  stage: string | null;
  waitingOn: string | null;
  nextAction: string;
  notes: string;
  email: string | null;
  recent: ContactEvent[]; // newest first
}

export interface MotionContact extends Contact {
  motionId: string;
  cycle: string | null;
  motion: string | null;
}

// Digest source. One entry per ACTIVE motion row, joined to its linked Contact (name/email)
// and that contact's recent Events. Process state (waitingOn, nextAction, "stage" = current
// Motion) comes from the motion row. `id` is the CONTACT id so Events linking + dedupe still
// work; `motionId` is carried for reference.
export async function listActiveMotions(): Promise<MotionContact[]> {
  const [mData, pData, eData] = await Promise.all([
    at(`${MOTIONS}?pageSize=100`),
    at(`${PROSPECTS}?pageSize=100`),
    at(`${EVENTS}?pageSize=100`),
  ]);
  const contactById: Record<string, any> = {};
  for (const rec of pData.records as any[]) contactById[rec.id] = rec.fields;
  const byProspect: Record<string, ContactEvent[]> = {};
  for (const e of eData.records as any[]) {
    const pid = e.fields["Prospect"]?.[0];
    if (!pid) continue;
    (byProspect[pid] ||= []).push({
      date: e.fields["Date"] || e.createdTime,
      direction: e.fields["Direction"]?.name ?? null,
      subject: e.fields["Subject"] ?? e.fields["Event"] ?? "",
    });
  }
  for (const k in byProspect) byProspect[k].sort((a, b) => b.date.localeCompare(a.date));
  const out: MotionContact[] = [];
  for (const rec of mData.records as any[]) {
    const f = rec.fields;
    if ((f["Status"]?.name ?? f["Status"]) !== "Active") continue;
    const contactId = f["Contact"]?.[0];
    if (!contactId) continue;
    const cf = contactById[contactId] ?? {};
    out.push({
      id: contactId,
      motionId: rec.id,
      name: cf["Name"] ?? "",
      company: cf["Company"] ?? "",
      type: f["Cycle"]?.name ?? null,
      cycle: f["Cycle"]?.name ?? null,
      motion: f["Motion"]?.name ?? null,
      stage: f["Motion"]?.name ?? null,
      waitingOn: f["Waiting On"]?.name ?? null,
      nextAction: f["Next Action"] ?? "",
      notes: f["Notes"] ?? "",
      email: cf["Email"] || null,
      recent: (byProspect[contactId] ?? []).slice(0, 5),
    });
  }
  return out;
}


// Idempotency: did today's digest already make a touch draft for this contact?
export async function draftExistsToday(prospectId: string, todayPrefix: string): Promise<boolean> {
  const data = await at(`${EVENTS}?pageSize=100`);
  return (data.records as any[]).some(
    (e) =>
      e.fields["Prospect"]?.[0] === prospectId &&
      String(e.fields["Event"] ?? "").startsWith("Daily touch:") &&
      String(e.createdTime ?? "").startsWith(todayPrefix),
  );
}

export async function createDailyDraft(c: Contact, intent: string, subject: string, body: string) {
  await at(EVENTS, {
    method: "POST",
    body: JSON.stringify({
      records: [
        {
          fields: {
            Event: `Daily touch: ${c.name || c.company}`,
            Prospect: [c.id],
            Status: "Drafted",
            Type: "Email",
            Direction: "Outbound",
            "To Email": c.email,
            Subject: subject,
            "Raw Text": body,
            "Approved to send": false,
            "Outcome / Notes": `Daily-digest suggestion (intent: ${intent}). Review, edit, and check "Approved to send" if it should go.`,
          },
        },
      ],
      typecast: true,
    }),
  });
}
