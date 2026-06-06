# Feed Rewire: Process State → Motions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the canon-crm-feed's process-state read/write off the Contacts table and onto the new Motions table, so Motions becomes the single source of truth for Waiting On / Next Action and the legible board is trustworthy.

**Architecture:** The feed currently writes exactly one field to Contacts (`Waiting On`) and reads Contacts for projection + the daily digest. We retarget those reads/writes at Motions: the Canon Domain key moves onto the Engagement motion row, the projection iterates motion rows and writes Waiting On there, and the digest reads process state from motion rows (joined to their linked Contact for email/name). Contacts keeps identity (Name, Company, Email, Owner) and its Events links. The destructive removal of the now-duplicated Contacts columns is the final, manually-gated task.

**Tech Stack:** TypeScript, tsx, Inngest, Airtable REST API. **No unit-test runner exists** — the codebase's test harness is the `scripts/validate-*.ts` dry-run scripts plus `npm run typecheck`. This plan verifies against those, per the established pattern. Do not introduce a new test framework.

---

## Key IDs (verified 2026-06-04)

```text
Base:            app5tsy6zjfA8H3rx
Contacts table:  tblG44S3hYR5j5K2t   (Owner, Email, Name, Company stay here)
Motions table:   tblK83JY2FUj3zR31
Events table:    tbl3t6RkAPxouWWzj   (unchanged by this plan)

Motions field IDs:
  Pursuit            fldX8BiW4pDvVEdp4
  Contact (link)     fld03PCg0244oEaiY   -> links to Contacts
  Cycle              fld9WPiftjxUJO7m0   (Engagement | Partnership)
  Motion             fld70C0OmZoXy3q2o
  Waiting On         fldj7STA67yg2DwYu   (Us | Them)
  Next Action        fldNsUbaDDFEz19gR
  Next Action Date   fldzoXFlHec8DOvIQ
  Entered            fldDReiUQqljtMuBj
  Status             fldjVAZQnHoviHJ5I   (Active | Done | Dropped)
  Notes              fldwS7UPznLD91GnW

RahrBSG engagement motion row: recd93aL3STHSuBix
RahrBSG contact:               recmQPXpEx4xQCNLb  (currently holds Canon Domain rahrbsg.com)
```

## File structure of changes

```text
src/lib/airtable.ts            heaviest. New Motions constants; toBinaryWaitingOn();
                               updateMotionState() (replaces updateState write target);
                               listTrackedMotions() (projection source);
                               listActiveMotions() (digest source). Old listTrackedProspects/
                               listContacts/updateState left in place until callers are migrated,
                               then deleted in Task 8.
src/functions/canon-events-to-crm.ts   iterate motions, write to motion row.
src/functions/daily-partner-digest.ts  iterate active motions; one touch per contact/day.
src/lib/derive.ts              unchanged (still outputs Us/Partner/Prospect; we map at the boundary).
src/lib/attention.ts           unchanged (assess() already keys on waitingOn === "Us").
src/lib/canon.ts               unchanged (still matched by { domain }).
scripts/validate-derive.ts     swap to listTrackedMotions + updateMotionState.
scripts/validate-digest.ts     swap to listActiveMotions.
Airtable Motions table         add Canon Domain field; copy rahrbsg.com onto the engagement row.
Airtable Contacts table        (Task 9, MANUAL/GATED) remove the 6 duplicated columns.
```

---

### Task 1: Add Canon Domain to Motions and migrate the key

**Files:** Airtable only (no code). Use the Airtable MCP.

- [ ] **Step 1: Add the field**

Call `create_field`:
```json
{ "baseId": "app5tsy6zjfA8H3rx", "tableId": "tblK83JY2FUj3zR31",
  "field": { "name": "Canon Domain", "type": "singleLineText",
    "description": "Email domain that identifies this engagement's external party in Canon (e.g. rahrbsg.com). Per-engagement key for the projection. Moved off Contacts." } }
```

- [ ] **Step 2: Copy rahrbsg.com onto the RahrBSG engagement motion row**

Call `update_records_for_table` (use the field ID returned in Step 1 as `<CANON_DOMAIN_FIELD_ID>`):
```json
{ "baseId": "app5tsy6zjfA8H3rx", "tableId": "tblK83JY2FUj3zR31",
  "records": [{ "id": "recd93aL3STHSuBix", "fields": { "<CANON_DOMAIN_FIELD_ID>": "rahrbsg.com" } }] }
```

- [ ] **Step 3: Verify** — `list_records_for_table` on Motions, confirm `recd93aL3STHSuBix` shows `Canon Domain = rahrbsg.com`. No other motion row has a domain (correct — RahrBSG is the only one wired to Canon today).

---

### Task 2: Motions constants + field map in airtable.ts

**Files:** Modify `src/lib/airtable.ts` (after the `FIELD` block, ~line 17)

- [ ] **Step 1: Add the Motions table id and field map**

```typescript
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
  canonDomain: "fldES4P7yPeZ7A6CU", // NOTE: replace with the Motions Canon Domain field ID from Task 1
} as const;
```
(Set `canonDomain` to the field ID Task 1 returned. The placeholder above is the *Contacts* Canon Domain ID — do not ship it.)

- [ ] **Step 2: Verify** — `npm run typecheck`. Expected: passes (unused const is fine in TS with noUnusedLocals off; if it errors, it'll be used by Task 4 — proceed).

---

### Task 3: toBinaryWaitingOn + updateMotionState

**Files:** Modify `src/lib/airtable.ts`

- [ ] **Step 1: Add the mapper** (near the top, after `PARTNER_OWNERS`)

```typescript
// Motions uses a binary court: Them = the external counterparty; Us = our side
// (including when the ball is with our partner Will/Larry). Maps derive()'s 3-value output.
export function toBinaryWaitingOn(w: WaitingOn): "Us" | "Them" | null {
  if (w === "Prospect") return "Them";
  if (w === "Us" || w === "Partner") return "Us";
  return null;
}
```

- [ ] **Step 2: Add updateMotionState** (alongside the existing `updateState`, which stays for now)

```typescript
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
```

- [ ] **Step 3: Verify** — `npm run typecheck`. Expected: passes.

---

### Task 4: listTrackedMotions (projection source)

**Files:** Modify `src/lib/airtable.ts`

- [ ] **Step 1: Add the interface + function**

```typescript
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
```

- [ ] **Step 2: Verify** — `npm run typecheck`. Expected: passes.

---

### Task 5: Rewire the projection function

**Files:** Modify `src/functions/canon-events-to-crm.ts`

- [ ] **Step 1: Swap imports** (line 7)

```typescript
import { listTrackedMotions, updateMotionState } from "../lib/airtable.js";
```

- [ ] **Step 2: Replace the body of the handler** (lines 17-36) with:

```typescript
  async ({ step }) => {
    const motions = await step.run("list-tracked-motions", () => listTrackedMotions());

    const results: Array<{ company: string; stage: string; waitingOn: string | null }> = [];
    for (const m of motions) {
      const derived = await step.run(`derive-${m.motionId}`, async () => {
        const interactions = await fetchInteractions(m.keys);
        // proposalSent: TODO wire to Artifacts table (type=Proposal, status sent). v1 = false.
        return derive({ interactions, ownerIsPartner: m.ownerIsPartner, proposalSent: false });
      });

      await step.run(`write-${m.motionId}`, () =>
        updateMotionState(m.motionId, derived.waitingOn, derived.basis),
      );
      results.push({ company: m.company, stage: derived.stage, waitingOn: derived.waitingOn });
    }
    return { updated: results.length, results };
  },
```

- [ ] **Step 3: Verify** — `npm run typecheck`. Expected: passes (the old `listTrackedProspects`/`updateState` are now unused but still exported; that's fine, removed in Task 8).

---

### Task 6: listActiveMotions (digest source)

**Files:** Modify `src/lib/airtable.ts`

- [ ] **Step 1: Add the interface** (after the existing `Contact` interface, ~line 137)

```typescript
export interface MotionContact extends Contact {
  motionId: string;
  cycle: string | null;
  motion: string | null;
}
```

- [ ] **Step 2: Add the function**

```typescript
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
```

- [ ] **Step 3: Verify** — `npm run typecheck`. Expected: passes.

---

### Task 7: Rewire the daily digest

**Files:** Modify `src/functions/daily-partner-digest.ts`

- [ ] **Step 1: Swap import** (line 5)

```typescript
import { listActiveMotions, draftExistsToday, createDailyDraft } from "../lib/airtable.js";
```

- [ ] **Step 2: Replace the handler body** (lines 12-27) with:

```typescript
  async ({ step }) => {
    const contacts = await step.run("list-active-motions", () => listActiveMotions());
    const today = new Date().toISOString().slice(0, 10);
    const seen = new Set<string>(); // one touch per contact/day even with multiple motions
    const made: Array<Record<string, unknown>> = [];
    for (const c of contacts) {
      if (!c.email) continue;
      const { attn, intent } = assess(c);
      if (!attn) continue;
      if (seen.has(c.id)) continue;
      seen.add(c.id);
      const exists = await step.run(`dedupe-${c.id}`, () => draftExistsToday(c.id, today));
      if (exists) continue;
      const { subject, body } = await step.run(`compose-${c.id}`, () => composeBody(c, intent));
      await step.run(`draft-${c.id}`, () => createDailyDraft(c, intent, subject, body));
      made.push({ id: c.id, name: c.name, intent });
    }
    return { drafted: made.length, made };
  },
```

(`composeBody(c, intent)` accepts a `Contact`; `MotionContact extends Contact`, so it passes unchanged.)

- [ ] **Step 3: Verify** — `npm run typecheck`. Expected: passes.

---

### Task 8: Delete the dead Contacts-sourced functions

**Files:** Modify `src/lib/airtable.ts`

- [ ] **Step 1:** Confirm nothing imports them: `grep -rn "listTrackedProspects\|updateState\|listContacts" src scripts`. The only remaining hits should be `scripts/validate-*.ts` (handled in Task 9). If a `src/` hit remains, fix that caller first.
- [ ] **Step 2:** Delete `listTrackedProspects` (airtable.ts:43-56), `updateState` (airtable.ts:58-78), `listContacts` (airtable.ts:139-167), and the now-unused `TrackedProspect` interface (airtable.ts:34-39).
- [ ] **Step 3: Verify** — `npm run typecheck`. Expected: passes after Task 9 updates the scripts. If scripts still reference them, do Task 9 first, then this.

---

### Task 9: Update the validation scripts

**Files:** Modify `scripts/validate-derive.ts` and `scripts/validate-digest.ts`

- [ ] **Step 1:** In `validate-derive.ts`, read the current file, then swap `listTrackedProspects` → `listTrackedMotions` and `updateState(p.id, derived.stage, derived.waitingOn, derived.basis)` → `updateMotionState(m.motionId, derived.waitingOn, derived.basis)`, iterating `motions` instead of `prospects`. Keep the `--dry` guard.
- [ ] **Step 2:** In `validate-digest.ts`, swap `listContacts` → `listActiveMotions`. The rest (assess + compose preview) is unchanged since `MotionContact extends Contact`.
- [ ] **Step 3: Verify** — `npm run typecheck`. Expected: passes.

---

### Task 10: End-to-end dry-run verification gate

**Files:** none (verification only). The system processes should be running per HANDOFF-next-session.md, or run the scripts standalone with env loaded.

- [ ] **Step 1: Projection dry run** — `node --import tsx scripts/validate-derive.ts --dry`
  Expected: lists RahrBSG (the one motion with a Canon Domain), prints a derived `waitingOn` and basis, writes nothing. No crash, no "0 motions".
- [ ] **Step 2: Live projection on RahrBSG only** — `node --import tsx scripts/validate-derive.ts`
  Expected: writes `Waiting On` to motion row `recd93aL3STHSuBix` (NOT to the Contacts record). Confirm via `list_records_for_table` on Motions that the RahrBSG row's Waiting On reflects the derived value (Us or Them), and the Contacts RahrBSG record's old Waiting On is untouched.
- [ ] **Step 3: Digest dry run** — `node --import tsx scripts/validate-digest.ts`
  Expected: iterates active motions, shows which contacts get a touch + intent + composed preview, drafts nothing. Confirm a contact with two active motions appears once, not twice.
- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(canon-crm-feed): project process state onto Motions table"
```

---

### Task 11 (GATED — DO NOT auto-run): Remove duplicated Contacts columns

**This is destructive and irreversible. Do NOT run without Nick's explicit go, and only after Task 10 proves the Motions board is trustworthy through at least one real digest + projection cycle.** The values are already copied into Motions, but deleting Airtable columns cannot be undone via API.

- [ ] **Step 1:** Confirm with Nick that the Motions board has been the working surface for at least a few days and nothing reads these Contacts fields anymore (`grep -rn "Waiting On\|Next Action\|\"Stage\"\|\"Type\"\|Canon Domain" src scripts` returns nothing in `src/`).
- [ ] **Step 2:** In Airtable, delete from Contacts (`tblG44S3hYR5j5K2t`): `Stage`, `Type`, `Waiting On`, `Next Action`, `Next Action Date`, `Canon Domain`. Keep Name, Company, Email, Owner, Role (job title), LinkedIn, Source, Notes, Meetings, Learnings, and the Motions back-link.
- [ ] **Step 3:** Update the Contacts table description to note process state now lives in Motions.

---

## Self-review notes

- **Spec coverage:** projection write (Tasks 3-5), digest read (Tasks 6-7), Canon Domain key move (Task 1), dead-code removal (Task 8), scripts (Task 9), verification (Task 10), destructive cleanup gated (Task 11). Covered.
- **Vocabulary:** derive() keeps Us/Partner/Prospect; `toBinaryWaitingOn` collapses to Us/Them at the write boundary (Partner→Us because the partner is our side). attention.ts `assess()` keys on `"Us"`, unaffected.
- **Not in scope (deliberate):** auto-advancing the `Motion` field (the state-machine engine) stays manual/Hermes-owned, same guardrail as today's Stage. Per-owner sender (will@) is unchanged. Moving Canon Domain per-engagement is handled, but multi-engagement-per-contact is not exercised (only RahrBSG has a domain today).
