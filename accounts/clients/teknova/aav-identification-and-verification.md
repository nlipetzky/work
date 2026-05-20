# Identifying and Verifying AAV Gene Therapy Companies — The Definitive Explanation

This is the canonical reference for how we identify and verify AAV gene therapy companies, why it is genuinely difficult, and why we built the method the way we did. It is the document to point anyone at — internally or with the client — when the question is "why is this hard, and why can't you just pull a list from a database?"

---

## 1. The deceptively simple ask

"Give us a list of AAV gene therapy companies" sounds like a database query. It is not. The phrase hides three separate, hard questions:

1. Is this company actually doing gene therapy (versus another modality wearing similar language)?
2. Is the vector specifically **AAV** (versus lentiviral, LNP, cell therapy, RNA, editing)?
3. Is that an active, real program (versus a stale tag, an acquired shell, or a disease that merely shares an acronym)?

A list is only as good as its weakest answer to those three. Most "AAV company lists" silently fail all three and look fine until someone who knows the field reads them.

## 2. Why you cannot just source from Apollo or Explorium

Apollo and Explorium are firmographic and contact databases. They are excellent at what they do: company size, industry codes, headcount, funding, contacts, org structure. That is exactly the problem. They classify companies by **industry and firmographics, not by therapeutic modality.**

- The best they can assert is "biotechnology company" or, occasionally, "gene therapy company." Neither distinguishes an AAV vector developer from a lentiviral, LNP, CRISPR, or autologous-cell company. The distinction that the entire offer depends on is invisible at the firmographic layer.
- An industry tag answers "is this a biotech?" It cannot answer "does this company run an AAV program?" Those are different questions with different evidence requirements. Treating an industry tag as a modality signal is the single most common way these lists go wrong.
- A database row is a snapshot, not a verification. It persists after a company is acquired, rebranded, or wound down, and it carries no proof — nothing to check, nothing to show the client.

This is not a credit or coverage limitation. It is structural. Firmographic data is the wrong instrument for a modality question, the same way a thermometer is the wrong instrument for measuring weight. We use those tools later, for what they are good at (size, fit, contacts). They are not the source of truth for "is this AAV."

## 3. The specific traps that make this hard

These are the failure modes that defeat naive approaches, each one observed in real data on this engagement:

- **The homonym.** "AAV" means Adeno-Associated Virus. It also means ANCA-Associated Vasculitis, an unrelated autoimmune disease. In clinical and database text these collide constantly. A keyword or tag search that does not actively resolve this conflates a vasculitis drug company with an AAV vector company. This is the highest-frequency false positive in the entire space.
- **Modality is not firmographic.** A company tagged "gene therapy" may be running lentiviral, non-viral, or cell therapy. The label is right; the modality is wrong for this offer. Only program-level evidence separates them.
- **Disease-adjacency is not modality.** A company can run a registered trial in a disease where AAV is common (hemophilia, an inherited retinal disease) while that specific trial is a standard-of-care drug study, an observational study, or an antibody study — not an AAV treatment at all. Matching on the disease surfaces the company; it does not prove the program.
- **Recognizable is not relevant.** Large pharma run real AAV programs but are out of profile by size. "It's in the database and it's famous" is not the same as "it is the customer." Modality confirmation and fit are different gates; conflating them is how lists lose credibility with people who know the field.
- **Single-source confidence is false confidence.** Any one provider's tag is wrong often enough that surfacing a company on a single source is where most mistakes enter. Real AAV companies almost always corroborate across multiple independent signals.
- **Stale and defunct identities.** Acquired, rebranded, or wound-down companies persist as live-looking rows long after they stop being real targets.

Any one of these is enough to discredit a list. In combination, they are why an unverified list is worse than no list: it looks authoritative and is wrong in ways only an expert catches — in front of the client.

## 4. Why clinicaltrials.gov is the starting point

clinicaltrials.gov is the U.S. government's registry of clinical trials. We start there because it is **primary-source evidence, not a tag.**

- A registered interventional trial is the company stating, on a public government registry, what it is actually doing in humans — the condition, the study type, and frequently the vector and the named investigational product.
- That lets us answer the modality question at the **program level**, which is the only level where the answer is real. Not "this company is tagged gene therapy" but "this company is sponsoring this specific trial of this specific AAV product in this specific indication."
- It is checkable. Every company we surface can be traced to a named trial a regulator, investor, or the client's own scientist can open and read. The evidence travels with the company.

It is the most authoritative single source available for the one question that matters. That is why it is first.

## 5. The complexity that remains even with clinicaltrials.gov

Using the right source does not make this automatic. The hard-won method exists because even primary-source evidence has to be handled carefully:

- **The cited trial must be the right trial.** A company surfaced because it has a trial in an AAV-common disease must still be checked: is *that trial* an AAV gene-therapy treatment, or a standard-of-care / observational / antibody study that merely shares the disease? The evidence attached to a company must be a trial that genuinely demonstrates AAV, not just a disease-adjacent one. Getting this wrong is subtle and was a real defect we found and fixed.
- **Disease match is necessary but not sufficient.** It must be combined with study-type and the actual intervention. All three together, never one alone.
- **Classification is a hypothesis; verification is the proof.** The system proposes; we then open the actual trial record and confirm by inspection. The system's own claim about itself is never the evidence. This is the discipline that catches the system's own mistakes before the client does.
- **Honest buckets.** Every company lands in confirmed, not-confirmed, or needs-expert-review — including companies the system flagged and we then disqualified. Surfacing our own misses is the method working, not failing.
- **Modality is not fit.** "Confirmed AAV" answers the science question only. Whether the company is the right size and stage to be a customer is a separate, deliberate layer. We never present AAV-confirmed as fit-vetted.

## 6. Why one source first, more sources later

The discipline is **consistency before breadth.** Until identification and verification are consistent and trustworthy against the single most authoritative source, adding more sources multiplies noise faster than coverage — every new source brings its own homonym traps, its own staleness, its own false positives, and the failures compound.

Once the verification method is proven and stable on clinicaltrials.gov, additional sources are layered in deliberately, each held to the **same verification standard**: patent filings, scientific publications, conference exhibitor and presenter lists, curated industry registries, the company's own pipeline disclosures, and firmographic enrichment for the size-and-fit layer. None of these replace the verification step; they widen the funnel into it. Capture authoritative evidence, verify it independently, prove it, then widen. Not the reverse.

---

## The definitive one paragraph

You cannot buy this list from a firmographic database, because those tools answer "is this a biotech" and the question is "does this company run an AAV gene therapy program" — a modality question they structurally cannot answer, made worse by an exact acronym collision with an unrelated disease, by modality labels that do not mean what they appear to, and by stale and single-source data. So we start from the authoritative primary source, clinicaltrials.gov, where a company states on the public record what it is actually doing; we verify every surfaced company against the real trial by hand, attach that evidence to it, sort honestly into confirmed / not confirmed / needs-review, and keep modality separate from fit. Other sources will be added — but only after identification and verification are consistent, and only held to the same standard, because breadth before consistency just multiplies the noise this method exists to remove.
