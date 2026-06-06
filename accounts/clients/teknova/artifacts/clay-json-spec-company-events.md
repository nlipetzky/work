# Clay JSON Spec: Company Events Fan-Out

**Purpose:** Defines the exact JSON structure Clay AI columns should output for each event type so that every relevant field in the Company Events table gets populated.

**How to use:** Each Clay AI column (wet lab sites, job openings, press mentions, clinical trials, conference appearances) should have this output schema in its prompt. The n8n fan-out workflow reads these fields automatically.

---

## Universal fields (required on every item in every event type)

```json
{
  "event_date": "YYYY-MM-DD",       // ISO date: when this event occurred or was first observed
  "activityStatus": "active",       // "active" | "inactive" | "unknown" | event-type-specific (see below)
  "activityRationale": "...",       // 1 sentence: why this status
  "confidence": "high"              // "high" | "medium" | "low" — per-item override; if all items share the same confidence, this can match the parent-level field
}
```

---

## Wet Lab Sites (`wet_lab_sites_json`)

Output the full object with `sites` array:

```json
{
  "sites": [
    {
      "city": "Sellersville",
      "state": "PA",
      "country": "United States",
      "address": "650 Cathill Rd, Sellersville, PA 18960",
      "siteType": "gmp_mfg",
      "evidenceUrl": "https://...",
      "event_date": "2024-01-15",          // when this facility was first publicly observed / announced
      "activityStatus": "active",          // "active" | "inactive" | "unknown"
      "activityRationale": "Confirmed active GMP manufacturing facility per company website",
      "magnitude": 450,                    // headcount or capacity — NUMBER, not string
      "magnitudeUnit": "employees",        // "employees" | "sq ft" | "batches/yr" — whatever is most meaningful
      "confidence": "high"
    }
  ],
  "verdict": "yes",
  "reasoning": "...",
  "confidence": "high",
  "stepsTaken": ["..."]
}
```

**Field mappings:**
| Clay field | Company Events field |
|---|---|
| `event_date` | Event Date |
| `activityStatus` | Activity Status |
| `activityRationale` | Activity Rationale |
| `magnitude` | Magnitude |
| `magnitudeUnit` | Magnitude Unit |
| `evidenceUrl` | Source URL, Raw Reference |
| `confidence` (per item) | Confidence |

---

## Job Openings (`job_openings_json`)

Output a flat array (no wrapper):

```json
[
  {
    "url": "https://careers.company.com/job/12345",
    "jobTitle": "Senior Scientist, ADC Development",
    "department": "R&D",
    "location": "Lexington, KY",
    "employmentType": "full-time",         // "full-time" | "part-time" | "contract"
    "event_date": "2024-03-01",            // posting date
    "activityStatus": "open",             // "open" | "filled" | "closed" | "unknown"
    "activityRationale": "Still listed on company careers page",
    "magnitude": 130,                     // salary midpoint in $K if determinable, else omit
    "magnitudeUnit": "$K/yr",
    "confidence": "high"
  }
]
```

**Field mappings:**
| Clay field | Company Events field |
|---|---|
| `event_date` | Event Date |
| `activityStatus` | Activity Status |
| `activityRationale` | Activity Rationale |
| `magnitude` | Magnitude |
| `magnitudeUnit` | Magnitude Unit |
| `url` | Source URL, External ID |
| `confidence` | Confidence |

---

## Press Mentions (`press_mentions_json`)

Output a flat array:

```json
[
  {
    "link": "https://biopharmadive.com/news/...",
    "title": "Piramal Expands ADC Capacity",
    "publication": "BioPharma Dive",
    "event_date": "2024-02-15",            // publication date
    "sentiment": "positive",              // "positive" | "neutral" | "negative"
    "activityStatus": "published",
    "activityRationale": "Article confirmed published and indexed",
    "confidence": "high"
  }
]
```

**Field mappings:**
| Clay field | Company Events field |
|---|---|
| `event_date` | Event Date |
| `sentiment` | Signal State (raw) |
| `publication` | Names |
| `link` | Source URL, External ID |
| `confidence` | Confidence |

---

## Clinical Trials (`clinical_trials_json`)

Output a flat array:

```json
[
  {
    "nctId": "NCT05123456",
    "title": "A Phase 2 Study of XYZ ADC in Solid Tumors",
    "phase": "Phase 2",
    "overallStatus": "Recruiting",
    "sponsor": "Piramal Pharma Solutions",
    "event_date": "2024-01-15",             // trial start date
    "estimatedCompletionDate": "2026-12-01",
    "enrollmentCount": 150,                 // NUMBER
    "enrollmentUnit": "participants",
    "studyType": "Interventional",
    "conditions": ["Solid Tumor", "NSCLC"],
    "interventionType": "Biological",
    "interventionNames": ["Anti-HER2 ADC", "Pertuzumab"],
    "primaryOutcome": "Overall response rate at week 24",
    "trialUrl": "https://clinicaltrials.gov/study/NCT05123456",
    "activityStatus": "active",             // "active" | "completed" | "terminated" | "unknown"
    "activityRationale": "Currently recruiting per ClinicalTrials.gov",
    "confidence": "high"
  }
]
```

**Field mappings:**
| Clay field | Company Events field |
|---|---|
| `event_date` | Event Date |
| `enrollmentCount` | Magnitude |
| `enrollmentUnit` | Magnitude Unit |
| `overallStatus` | Signal State (raw) |
| `activityStatus` | Activity Status |
| `activityRationale` | Activity Rationale |
| `phase` | Trial Phase |
| `studyType` | Study Type |
| `conditions` (joined) | Conditions |
| `interventionType` | Intervention Type |
| `interventionNames` (joined) | Intervention Names |
| `primaryOutcome` | Intervention Detail |
| `nctId` | External ID |
| `trialUrl` | Source URL |
| `confidence` | Confidence |

---

## Conference Appearances (`conference_appearances_json`)

Output a flat array:

```json
[
  {
    "conferenceName": "AACR Annual Meeting 2024",
    "date": "2024-04-08",                  // date of the presentation
    "title": "ADC Manufacturing at Scale: Lessons from Clinical to Commercial",
    "speaker": "Dr. Jane Smith",
    "sessionType": "oral presentation",    // "oral presentation" | "poster" | "keynote" | "panel"
    "url": "https://...",
    "activityStatus": "completed",         // "completed" | "upcoming" | "unknown"
    "activityRationale": "Conference concluded April 2024",
    "confidence": "high"
  }
]
```

**Field mappings:**
| Clay field | Company Events field |
|---|---|
| `date` | Event Date |
| `sessionType` | Signal State (raw) |
| `activityStatus` | Activity Status |
| `activityRationale` | Activity Rationale |
| `url` | Source URL |
| `confidence` | Confidence |
| `speaker` | Names (alongside conferenceName) |

---

## Fields the n8n Code node fills automatically (no Clay instruction needed)

| Field | Source |
|---|---|
| `Signal State (raw)` | `sentiment` for press; `sessionType` for conference; `overallStatus` for trials; parent `verdict` for sites/jobs |
| `Confidence` | per-item `confidence` field (with parent-level fallback) |
| `Is Latest` | Always `true` on insert (dedupe handles versioning) |
| `Trigger` | Always "Fan-Out" |
| `Provider` | Always "Clay" |
| `Detected At` | Workflow run date |
| `dedupe_composite_key` | Auto-generated |
| `Event ID` | Same as dedupe key |
| `Raw Payload` | Full item JSON |

---

## Notes for Clay prompts

- `event_date` must be `YYYY-MM-DD` format or ISO datetime. Empty string if unknown, do not guess.
- `magnitude` must be a **number**, not a string. Omit the field entirely if unknown rather than returning 0 or null.
- `activityStatus` values should be consistent within each event type (see per-type examples above).
- `conditions` and `interventionNames` should be arrays of strings, not comma-joined strings.
- For wet lab sites, `magnitudeUnit` is the most uncertain field -- provide it only if you have reasonable evidence (facility headcount, sq footage). Prefer "employees" when you can cite it.
