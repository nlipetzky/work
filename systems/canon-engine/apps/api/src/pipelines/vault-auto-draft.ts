import { getAosOperationalSupabase } from "../lib/aos-operational.js";
import { getCanonSupabase } from "./deps.js";

const INSTIG8_TENANT_ID = "03180256-bb8b-4421-8adf-c1fe3567958d";
const VALID_CATEGORIES = [
  "governance",
  "protocols",
  "architecture",
  "anti-patterns",
  "agents",
  "schemas",
  "accounts",
] as const;

export interface VaultDraftPayload {
  category: string;
  title: string;
  content: string;
  source_agent: string;
  rationale: string;
  suggested_path?: string;
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function buildDraftContent(payload: VaultDraftPayload, docPath: string): string {
  const date = new Date().toISOString().split("T")[0];
  return [
    `# ${payload.title}`,
    "",
    `<!-- Draft — source: ${payload.source_agent}, date: ${date} -->`,
    `<!-- Rationale: ${payload.rationale} -->`,
    `<!-- Path: ${docPath} -->`,
    "",
    payload.content,
  ].join("\n");
}

export async function runVaultAutoDraft(payload: VaultDraftPayload): Promise<{
  title: string;
  category: string;
  path: string;
  version_id: string;
  source_agent: string;
}> {
  // Resolve target path
  let docPath: string;
  let category: string;

  if (payload.suggested_path) {
    const normalized = payload.suggested_path.replace(/^\/+/, "");
    category = normalized.split("/")[0] ?? payload.category;
    docPath = normalized;
  } else {
    category = VALID_CATEGORIES.includes(payload.category as typeof VALID_CATEGORIES[number])
      ? payload.category
      : "governance";
    const slug = slugify(payload.title);
    docPath = `${category}/drafts/${slug}.md`;
  }

  // Write to canon_docs (suffix on collision)
  const canon = getCanonSupabase();

  let target = docPath;
  const { data: existing } = await canon
    .from("v_active_canon_docs")
    .select("id")
    .eq("tenant_id", INSTIG8_TENANT_ID)
    .eq("path", target)
    .maybeSingle();

  if (existing) {
    const ts = Date.now();
    target = docPath.replace(/\.md$/, `-${ts}.md`);
  }

  const { data, error } = await canon
    .from("canon_docs")
    .insert({
      tenant_id: INSTIG8_TENANT_ID,
      path: target,
      title: payload.title,
      content_md: buildDraftContent(payload, target),
      source: "agent",
      updated_by: payload.source_agent,
      metadata: {
        rationale: payload.rationale,
        category,
        auto_draft: true,
        drafted_at: new Date().toISOString(),
      },
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`canon_docs insert failed: ${error?.message ?? "no row returned"}`);
  }

  const finalPath = target;
  const versionId = data.id as string;

  // Review ticket in AOS Operational roadmap
  const aos = getAosOperationalSupabase();
  const date = new Date().toISOString().split("T")[0];
  await aos.from("roadmap").insert({
    effort_name: `Review canon draft: ${payload.title}`,
    description: `Auto-drafted by ${payload.source_agent}. Rationale: ${payload.rationale}`,
    acceptance_criteria:
      "Nick reviews the draft in /library/systems and either promotes it (edit to remove the auto-draft markers), leaves it as-is, or retires it.",
    priority: 8,
    status: "not started",
    account_id: "4ea800ed-2532-44b4-8f3b-a1acad31db8d",
    owned_by: payload.source_agent,
    notes: `Canon draft created ${date}. Category: ${category}. Path: ${finalPath}. Version: ${versionId}.`,
  });

  return {
    title: payload.title,
    category,
    path: finalPath,
    version_id: versionId,
    source_agent: payload.source_agent,
  };
}
