// Load .env with override: the shell exports some vars empty (e.g. ANTHROPIC_API_KEY on this
// machine), and dotenv/Node --env-file won't replace an already-set var. override makes .env
// authoritative for this app. Import this FIRST in every entry point.
import dotenv from "dotenv";
dotenv.config({ override: true });
