# Gmail send setup (one-time)

Goal: let the send function transmit as nick@konstellationai.com using the existing Canon
identity `aos-fetcher@instig8-aos-events.iam.gserviceaccount.com` (domain-wide delegation),
not a new credential. Two changes: add a scope, get a key.

## 0. Point gcloud at the right account/project

The SA lives in project `instig8-aos-events`; nick@konstellationai.com has no IAM there.
Switch to the project-owning account:

```bash
gcloud config set account nick@instig8.ai
gcloud config set project instig8-aos-events
```
(If nick@instig8.ai is also denied, grant it `roles/iam.serviceAccountKeyAdmin` on the SA.)

## 1. Service account OAuth client ID (already known)

**Client ID = `103859368631711896380`** (the SA's unique ID; revealed in the IAM resource path).
Use this for delegation in step 2. No command needed.

## 2. Delegation scope — NO CHANGE NEEDED

Confirmed 2026-06-04: the existing delegation "AOS gws CLI" (Client ID `103859368631711896380`)
in the konstellationai.com Workspace already grants:
`gmail.readonly`, **`gmail.modify`**, `meetings.space.readonly`, `drive.readonly`, `calendar.readonly`.

Gmail's `users.messages.send` accepts `gmail.modify` as an authorizing scope, so **sending as
nick@konstellationai.com already works under the current delegation.** Do not add `gmail.send`:
`gmail.modify` is already granted for ingestion and is broader, so there's no least-privilege
gain. The send function requests `gmail.modify` and calls `messages.send`.

## 3. Get the service-account key for the function

```bash
mkdir -p /Users/nplmini/code/work/systems/canon-crm-feed/.secrets
gcloud iam service-accounts keys create \
  /Users/nplmini/code/work/systems/canon-crm-feed/.secrets/aos-fetcher.json \
  --iam-account=aos-fetcher@instig8-aos-events.iam.gserviceaccount.com
chmod 600 /Users/nplmini/code/work/systems/canon-crm-feed/.secrets/aos-fetcher.json
```
(`.secrets/` and `.env` are already gitignored.)

If key creation is blocked by org policy (`iam.disableServiceAccountKeyCreation`), use
impersonation instead:
```bash
gcloud iam service-accounts add-iam-policy-binding \
  aos-fetcher@instig8-aos-events.iam.gserviceaccount.com \
  --member="user:YOUR_GCLOUD_ACCOUNT" --role="roles/iam.serviceAccountTokenCreator"
gcloud auth application-default login
```
...and tell me; the function wires differently for impersonation vs key file.

## 4. Confirm the Gmail API is on (idempotent)

```bash
gcloud services enable gmail.googleapis.com
```

## 5. Add to .env

```
GMAIL_SA_KEY_PATH=./.secrets/aos-fetcher.json
GMAIL_SEND_AS=nick@konstellationai.com
```

When 1-5 are done, tell me and I'll build the send function (Gmail API, impersonate
GMAIL_SEND_AS, idempotent, flips the approved Event to Sent) and test it against the dev server
with the approval box still off.
