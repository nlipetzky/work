// Gmail send via the aos-fetcher service account, impersonating the chosen `from` mailbox
// through domain-wide delegation. Requests gmail.modify (authorizes messages.send).
// NOTE: each `from` domain (konstellationai.com, instig8.ai) must authorize this SA's
// domain-wide delegation in its own Workspace admin, or impersonation fails (invalid_grant).
import { google } from "googleapis";
import { readFileSync } from "node:fs";

const KEY_PATH = process.env.GMAIL_SA_KEY_PATH!;
const SCOPES = ["https://www.googleapis.com/auth/gmail.modify"];

function gmail(from: string) {
  const creds = JSON.parse(readFileSync(KEY_PATH, "utf8"));
  const auth = new google.auth.JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: SCOPES,
    subject: from, // impersonate the sender mailbox
  });
  return google.gmail({ version: "v1", auth });
}

// Proves the auth chain for a given sender WITHOUT sending. Returns the mailbox ... should equal `from`.
export async function verifyImpersonation(from: string): Promise<string> {
  const res = await gmail(from).users.getProfile({ userId: "me" });
  return res.data.emailAddress ?? "";
}

function buildRaw(from: string, to: string, subject: string, body: string): string {
  const msg =
    [
      `From: ${from}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      "MIME-Version: 1.0",
      'Content-Type: text/plain; charset="UTF-8"',
    ].join("\r\n") +
    "\r\n\r\n" +
    body;
  return Buffer.from(msg, "utf8").toString("base64url");
}

export async function sendEmail(from: string, to: string, subject: string, body: string): Promise<string> {
  const res = await gmail(from).users.messages.send({
    userId: "me",
    requestBody: { raw: buildRaw(from, to, subject, body) },
  });
  return res.data.id ?? "";
}
