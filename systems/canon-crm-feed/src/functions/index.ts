import { canonEventsToCrm } from "./canon-events-to-crm.js";
import { sendApprovedDrafts } from "./send-approved-drafts.js";
import { dailyPartnerDigest } from "./daily-partner-digest.js";

export const functions = [canonEventsToCrm, sendApprovedDrafts, dailyPartnerDigest];
