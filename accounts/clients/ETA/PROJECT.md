# ETA Jets — Empty Leg Automation Project

## Overview
Private aviation charter company. Automates ingestion, content generation, and Instagram publishing of "empty leg" flight opportunities ($15K–$250K). Human-in-the-loop for pricing and approval.

**Client:** ETA Jets (Cory Samuels is primary contact)
**Builder:** Konstellation AI / Creative Glu (Praneeth Nadella, engineering)
**Status:** V1 Closeout — system built, migrating to client's n8n account

---

## Airtable Bases

| Base ID | Name | Permission |
|---------|------|------------|
| `appvBraG4OftrXwYA` | ETA Jets - Logistics Engine | create |
| `apphMLvlrRnNbvdEj` | Creative Glu Instagram Automation | create |
| `app9E0sTWJrN48OpC` | Creative Glu SmartLayer CRM | create |

---

### Base 1: `appvBraG4OftrXwYA` — ETA Jets - Logistics Engine

Core operational base. Tracks the full pipeline: emails → flights → content → publishing.

**Table: `tblTdVLVwXVJB1xEH` — Emails (Outlook Ingest)**
| Field | Type | Notes |
|-------|------|-------|
| Email Subject | singleLineText | |
| Email Status | singleSelect | New / Processed / Junk |
| From | singleLineText | |
| To | singleLineText | |
| CC | singleLineText | |
| Received Date | dateTime | |
| Body Preview | singleLineText | |
| Full Body | multilineText | Raw email body fed to LLM |
| Attachments | multipleAttachments | |
| Outlook Message ID | singleLineText | |
| Thread/Conversation ID | singleLineText | |
| Is Read | checkbox | |
| Linked Flight Opportunity | multipleRecordLinks | → Flight Opportunities |
| AI: Summarize Email | singleLineText | AI-generated |
| AI: Categorize Email Intent | singleSelect | Inquiry / Support Request / Booking Confirmation / Operator Update / Media Asset Request / Other |
| AI: Suggest Next Action | singleLineText | AI-generated |
| Source Email ID | formula | RECORD_ID() |

**Table: `tblRDHHWwnjTDSQtC` — Flight Opportunities**
| Field | Type | Notes |
|-------|------|-------|
| Source_ID | singleLineText | Primary field |
| Status | singleSelect | Ingested / Normalized / Sent to Content / Expired / Duplicate |
| Operator_Name | singleLineText | |
| Dep_Airport_ICAO | singleLineText | 4-letter ICAO code |
| Arr_Airport_ICAO | singleLineText | 4-letter ICAO code |
| Flight_Date | singleLineText | Date or date range as text |
| Aircraft_Raw | singleLineText | Full make/model from email |
| Price_USD | currency ($) | Extracted from email |
| Media_Availability | checkbox | Checked if automation verified assets exist |
| Aircraft_Normalized | multipleRecordLinks | → Master Aircraft (`tblxcSsiH9qWtR0rI`), prefersSingle |
| Content Assets | multipleRecordLinks | → Content Assets (`tblPXRd5MxrGXR1Rx`) |
| Review_Status | singleSelect | Pending Review / Approved for Content / Rejected / On Hold |
| Reviewer_Notes | multilineText | |
| Manual_Price_Override | currency ($) | Human-set price |
| Review_Date | dateTime | |
| Reviewed_By | singleCollaborator | |
| Record ID | formula | RECORD_ID() |
| Emails (Outlook Ingest) | multipleRecordLinks | → Emails (`tblTdVLVwXVJB1xEH`) |
| Date Entered | createdTime | |

**Table: `tblPXRd5MxrGXR1Rx` — Content Assets**
| Field | Type | Notes |
|-------|------|-------|
| Asset_ID | formula | RECORD_ID() |
| AutoNumber | autoNumber | |
| Source_Deal | multipleRecordLinks | → Flight Opportunities (`tblRDHHWwnjTDSQtC`) |
| Image_Path | singleLineText | Google Drive URL |
| View Image | formula | URL display |
| Caption_Text | multilineText | AI-generated IG caption |
| Status | singleSelect | Draft / Needs Approval / Approved / Published / Failed |
| Blotato_Post_ID | singleLineText | Publishing platform reference |
| Scheduled_Time | dateTime | |
| Engagement Log | multipleRecordLinks | → Engagement tracking |
| Image | multipleAttachments | Image file |

**Table: `tblxcSsiH9qWtR0rI` — Master Aircraft**
| Linked from | Flight Opportunities → Aircraft_Normalized |
|-------------|---------------------------------------------|
| Contains canonical aircraft types for normalization |

---

### Base 2: `apphMLvlrRnNbvdEj` — Creative Glu Instagram Automation

Content pipeline for Instagram — manages ideas, workflow status, AI production, and content library.

**Table: `tblWfbSLYnlQB9gN7` — Content**
| Field | Type | Notes |
|-------|------|-------|
| Idea ID | number | Primary field |
| Source Content | url | |
| Workflow | multipleRecordLinks | → Workflow (`tblcw0GR2pH4WgvFO`) |
| Workflow Status | multipleSelects | Triggered / Running / Scraping / Creating / Posting / Complete / Make Workflow Error |
| Quote/Theme | multilineText | |
| Production | multipleRecordLinks | → AI Production (`tblzu7Ccg4diCIY05`) |
| Library Content | multipleRecordLinks | → Content Library (`tblYuYFyxA0OQpUWm`) |
| RecordID | formula | RECORD_ID() |
| Trigger ID (from Workflow) | lookup | |

**Table: `tblcw0GR2pH4WgvFO` — Workflow**
| Linked from | Content → Workflow |
|-------------|-------------------|
| Manages workflow execution state and triggers |

**Table: `tblzu7Ccg4diCIY05` — AI Production**
| Field | Type | Notes |
|-------|------|-------|
| Content ID | autoNumber | Primary field |
| Workflow | multipleRecordLinks | → Workflow (`tblcw0GR2pH4WgvFO`) |
| Trigger ID (from Workflow) | lookup | |
| Tracks creative asset production via social tools |

**Table: `tblYuYFyxA0OQpUWm` — Content Library**
| Field | Type | Notes |
|-------|------|-------|
| Asset ID | autoNumber | Primary field |
| Content | multipleRecordLinks | → Content (`tblWfbSLYnlQB9gN7`) |
| Stores finalized content assets |

---

### Base 3: `app9E0sTWJrN48OpC` — Creative Glu SmartLayer CRM

Instagram-focused CRM for contact enrichment and DM lead management.

**Table: `tbldvSf7dXemUrUXS` — Contacts (Instagram)**
| Field | Type | Notes |
|-------|------|-------|
| Instagram Username | singleLineText | Primary field |
| Trigger | multipleRecordLinks | → Trigger (`tblDKmdSaTsJO65He`) |
| Enrichment Status | singleSelect | Sending Crawler / Getting Instagram Profile / Organizing Data / Instagram Scrape Complete / Getting Website Info / Website Abstract Complete / Website URL Not Found / Make Workflow Error |
| Supabase ID | singleLineText | |
| Unified record of every person, regardless of source |

**Table: `tblDKmdSaTsJO65He` — Trigger**
| Linked from | Contacts → Trigger |
|-------------|-------------------|
| DM triggers and inbound signal tracking |

**Table: `tblVjpb72R0Rx8WJ2` — Scenarios**
| Description | Organizes both inbound and outbound efforts |
|-------------|---------------------------------------------|

---

### Cross-Base Relationships
```
Base 1: Logistics Engine                Base 2: Instagram Automation         Base 3: SmartLayer CRM
┌─────────────────────┐                ┌──────────────────────┐             ┌────────────────────┐
│ Emails (Outlook)    │                │ Content              │             │ Contacts (IG)      │
│   ↓ linked          │                │   ↔ Workflow         │             │   ↔ Trigger        │
│ Flight Opportunities│                │   ↔ AI Production    │             │   enrichment pipeline
│   ↔ Master Aircraft │                │   ↔ Content Library  │             │                    │
│   ↔ Content Assets  │───publishes───→│                      │──DM leads──→│ Scenarios          │
│     ↔ Engagement Log│                └──────────────────────┘             └────────────────────┘
└─────────────────────┘
```

---

## n8n Workflows (Creative Glu project: `zUtXwwXkg6z00OLO`)

### Active (Published)

| # | ID | Name | Triggers | Last Updated |
|---|-----|------|----------|-------------|
| 1 | `sickK3Kyck6X7rM3` | Empty Leg Ingestion | Webhook + Schedule | 2026-04-21 |
| 2 | `4ovg5GUeDPa1PtUg` | Empty Leg Logistics Engine | Schedule (daily 10am) | 2026-04-21 |
| 3 | `eSZfML2f4soEpKY8` | Content Generation | Webhook + Schedule | 2026-04-13 |
| 4 | `LF3lCrcuXtwTdQn3` | Instagram Publisher | Webhook (1 trigger) | 2026-04-13 |

### Inactive (Old/Variant Versions)

| ID | Name | Notes |
|----|------|-------|
| `EWJdPNH6xvPDkCi8` | DM Listener | Inactive |
| `7l95bN1Ua0qZjyre` | Empty Leg Ingestion w Master Aircraft list | Inactive copy |
| `g6LVIMmSNCDpcro6` | Content Generation w Master aircraft | Inactive copy |
| `sIVdb92pcQxD6nydxKTlB` | Content Generation (Renderer Fixed) | Inactive variant |
| `t6j6AxmbLqM73Vmd` | OLD - Instagram Publisher | Replaced by LF3lCrcuXtwTdQn3 |

### Workflow Details

**1. Empty Leg Ingestion (`sickK3Kyck6X7rM3`)**
- Webhook receives record ID → fetches email from Airtable "Emails (Outlook Ingest)"
- Sends Full Body to GPT-4.1-mini for structured extraction (ICAO codes, aircraft, dates, prices)
- Parses response → If relevant: splits flights array → creates Flight Opportunity records
- If junk: marks email as Junk
- On success: marks email as Processed
- Webhook URL: `/webhook/cf73c99e-726a-46ba-a908-31bb2b1ebad2`

**2. Empty Leg Logistics Engine (`4ovg5GUeDPa1PtUg`)**
- Daily 10am cron → fetches from FlyEasy, Avinode, Email (ALL MOCK DATA currently)
- Merges sources → normalizes ICAO codes → generates dedup hash
- Upserts to Flight Opportunities in Airtable → generates CSV
- NOTE: This workflow still uses hardcoded mock data — not connected to real sources

**3. Content Generation (`eSZfML2f4soEpKY8`)**
- Webhook receives flight record ID → fetches from Airtable
- Searches Google Drive "Approved Content for Automation" folder (`1TepifxFipa6n3jg2DkOFcIB6akqkiYhA`) for aircraft images
- If image found: picks random image, downloads it
- If no image: creates blank black canvas (1080x1440)
- Generates IG caption via GPT-4.1-mini (route, aircraft, price, urgency + "DM for details")
- Overlays caption text on image (Comic Sans, white, 48pt)
- Uploads to Google Drive "ETA Content File" folder (`1dFbdVemK0j6qdElhWxurZygFA-saECah`) on Shared Drive "ETA Jets Content" (`0AFTnJS_fgX8NUk9PVA`)
- Creates Content Asset record in Airtable (Status: "Needs Approval")
- Updates Flight Opportunity status to "Sent to Content"
- Webhook URL: `/webhook/3b7647f7-2f82-4f7d-b0d1-94396b266fcc`

**4. Instagram Publisher (`LF3lCrcuXtwTdQn3`)**
- Not MCP-accessible (enable in n8n workflow settings to inspect)
- Presumably reads approved Content Assets and publishes to IG Stories via Blotato

### Workflow Chain
```
Outlook Emails → [Logistics Engine polls / manual ingest]
                        ↓
              Emails (Outlook Ingest) table
                        ↓
              [Empty Leg Ingestion] → webhook triggered per email
                        ↓
              Flight Opportunities table (Status: Ingested)
                        ↓
              Human Review → Review_Status: Approved for Content
                        ↓
              [Content Generation] → webhook triggered per flight
                        ↓
              Content Assets table (Status: Needs Approval)
                        ↓
              Human Approval → Status: Approved
                        ↓
              [Instagram Publisher] → publishes to IG Stories
                        ↓
              DM responses → SmartLayer CRM (Contacts)
```

---

## Key Integrations

| System | Role | Credentials |
|--------|------|-------------|
| n8n (instig8.app.n8n.cloud) | Automation runtime | Creative Glu project |
| Airtable | Database & approval interface | 3 bases (PAT available) |
| Google Workspace (Outlook) | Email ingestion from emptylegs@flyetajets.com | Outlook connected |
| Google Drive | Aircraft image library + generated content storage | Shared Drive "ETA Jets Content" |
| Instagram | Publishing surface (Stories) | Via Blotato |
| HubSpot | CRM — DM lead routing to Cory | |
| OpenAI (GPT-4.1-mini) | Email parsing + caption generation | |
| FlyEasy | Empty leg data provider (email drops, not API) | Saved $700/mo |
| 1Password | Credential vault | |

---

## Google Drive Structure

| Drive / Folder | ID | Purpose |
|---------------|----|---------|
| ETA Jets Content (Shared Drive) | `0AFTnJS_fgX8NUk9PVA` | Root shared drive |
| Approved Content for Automation | `1TepifxFipa6n3jg2DkOFcIB6akqkiYhA` | Source aircraft images |
| ETA Content File | `1dFbdVemK0j6qdElhWxurZygFA-saECah` | Generated story images output |

---

## NotebookLM
- **Notebook ID:** `5e88c36f-6df5-4206-83fa-88b67cadca55`
- **Sources:** 15 (all stale as of March 2026)
- Contains: Execution Charter, TRD, n8n Logic Flowchart, Automation Spec, Environment Config, Prompt I/O Contract, meeting transcripts, email threads

---

## Open Items
1. **Instagram Publisher** — Not MCP-accessible; enable MCP in n8n workflow settings to inspect
2. **Logistics Engine uses mock data** — FlyEasy/Avinode/Email fetches are hardcoded stubs
3. **V1 closeout pending** — final live walkthrough with ETA Jets, then migrate to their n8n account
4. **Master Aircraft table** — schema partially visible (linked from Flight Opportunities); needs direct inspection
