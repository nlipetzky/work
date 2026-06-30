// Bridge to the hand-authored SOP definitions in systems/operating-sop/sops/.
// Encapsulates the relative path in one place so the rest of projection-ui
// imports from `@/lib/sops` only. When the SOP definitions migrate from
// hand-authored TS to the canon schema (SPEC §5), this bridge becomes a
// Supabase reader.

export * from "../../operating-sop/sops";
