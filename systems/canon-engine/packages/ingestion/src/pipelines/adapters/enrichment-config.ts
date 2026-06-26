/**
 * Canon Engine — Enrichment configuration adapter.
 *
 * Fetches LLM enrichment prompts from the Airtable "Enrichment Configs" table
 * in the Unified Knowledge base. Enables per-pipeline customization
 * of system prompts and user prompt templates without code changes.
 *
 * Table: Enrichment Configs (tblgqfLeNqdbx7StB) in Knowledge Base (appkhGXFz2HCQgfsA)
 *
 * TODO: Migrate to read from Supabase enrichment_configs table instead of Airtable.
 *
 * Usage:
 *   const adapter = createEnrichmentConfigAdapter(apiKey, baseId);
 *   const config = await adapter.fetchConfig('transcript');
 *   // config is null if no active record found → caller falls back to hardcoded prompts
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ENRICHMENT_CONFIGS_TABLE_ID = 'tblgqfLeNqdbx7StB';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EnrichmentConfig {
  configName: string;
  pipelineType: 'transcript' | 'email' | 'document';
  systemPrompt: string;
  userPromptTemplate: string;
  model?: string;
  maxInputTokens?: number;
  status: 'active' | 'draft' | 'archived';
}

export interface EnrichmentConfigAdapter {
  /** Fetch the active config for pipelineType. Returns null if none found. */
  fetchConfig(
    pipelineType: 'transcript' | 'email' | 'document',
  ): Promise<EnrichmentConfig | null>;
}

// ---------------------------------------------------------------------------
// Airtable record shape (raw API response)
// ---------------------------------------------------------------------------

interface AirtableEnrichmentRecord {
  id: string;
  fields: {
    'Config Name'?: string;
    Org?: string;
    'Pipeline Type'?: string;
    'System Prompt'?: string;
    'User Prompt Template'?: string;
    Model?: string;
    'Max Input Tokens'?: number;
    Status?: string;
    Notes?: string;
  };
}

interface AirtableListResponse {
  records: AirtableEnrichmentRecord[];
  offset?: string;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create an EnrichmentConfigAdapter backed by Airtable.
 *
 * @param apiKey   Airtable Personal Access Token
 * @param baseId   Unified Knowledge base ID (e.g. appkhGXFz2HCQgfsA)
 */
export function createEnrichmentConfigAdapter(
  apiKey: string,
  baseId: string,
): EnrichmentConfigAdapter {
  return {
    async fetchConfig(pipelineType): Promise<EnrichmentConfig | null> {
      // Build filterByFormula: match pipelineType + status=active
      const formula = encodeURIComponent(
        `AND({Pipeline Type} = "${pipelineType}", {Status} = "active")`,
      );
      const url =
        `https://api.airtable.com/v0/${baseId}/${ENRICHMENT_CONFIGS_TABLE_ID}` +
        `?filterByFormula=${formula}&maxRecords=1`;

      let response: Response;
      try {
        response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        });
      } catch (err) {
        // Network error — log and fall back to hardcoded prompts
        console.warn(`[enrichment-config] Network error fetching config for ${pipelineType}:`, err);
        return null;
      }

      if (!response.ok) {
        console.warn(
          `[enrichment-config] Airtable returned ${response.status} for ${pipelineType}`,
        );
        return null;
      }

      const data = (await response.json()) as AirtableListResponse;
      const record = data.records?.[0];

      if (!record) {
        return null; // No active config — caller uses hardcoded fallback
      }

      const f = record.fields;

      // Require both prompt fields to be present before using the config
      if (!f['System Prompt'] || !f['User Prompt Template']) {
        console.warn(
          `[enrichment-config] Config "${f['Config Name']}" is missing required prompt fields`,
        );
        return null;
      }

      return {
        configName: f['Config Name'] ?? '',
        pipelineType: (f['Pipeline Type'] as EnrichmentConfig['pipelineType']) ?? pipelineType,
        systemPrompt: f['System Prompt'],
        userPromptTemplate: f['User Prompt Template'],
        model: f['Model'] ?? undefined,
        maxInputTokens: f['Max Input Tokens'] ?? undefined,
        status: (f['Status'] as EnrichmentConfig['status']) ?? 'active',
      };
    },
  };
}

// ---------------------------------------------------------------------------
// Template renderer
// ---------------------------------------------------------------------------

/**
 * Substitute `{{key}}` placeholders in a template string.
 *
 * Example:
 *   renderTemplate("Hello {{name}}!", { name: "Nick" }) → "Hello Nick!"
 *
 * Unknown placeholders are left as-is (not replaced).
 */
export function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    return Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : match;
  });
}
