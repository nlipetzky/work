import type { ActivityJudgment } from "@/lib/operate/composition-draft";

// The active rulings + options the domain AI-expert-folder contributes to this
// activity — the "defaults from the folder" (read from canon v_folder_active_units,
// standing in active|locked). Read-only surface in the /operate cockpit; filing +
// ratify happen via the file-judgment-unit skill and the /folder surface.

const chip = "rounded px-1.5 py-0.5 text-[9px] uppercase tracking-wider";

function Standing({ value }: { value: "proposed" | "active" | "locked" }) {
  const tone =
    value === "locked" ? "bg-ok/20 text-ok" : value === "active" ? "bg-ok/10 text-ok" : "bg-warn/10 text-warn";
  return <span className={`${chip} ${tone}`}>{value}</span>;
}

function Prov({ value }: { value: string }) {
  const tone = value === "ai_originated" ? "bg-accent/10 text-accent" : "bg-ink-700 text-muted";
  return <span className={`${chip} ${tone}`}>{value.replace(/_/g, " ")}</span>;
}

export function FolderDefaults({ judgment }: { judgment: ActivityJudgment | null }) {
  const rulings = judgment?.rulings ?? [];
  const options = judgment?.options ?? [];
  const count = rulings.length + options.length;

  return (
    <div>
      <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-ink-600">
        Folder defaults{" "}
        <span className="font-normal text-muted">· {count} from the folder</span>
      </h3>

      {count === 0 ? (
        <p className="text-xs text-muted">
          No folder rulings or options bound to this activity yet. As the folder accumulates
          judgment (via a bound session or the Folder surface), the active defaults for this step
          surface here.
        </p>
      ) : (
        <div className="space-y-2">
          {options.map((o) => (
            <div key={o.id} className="rounded-lg border border-ink-700 bg-ink-900/40 p-3">
              <div className="mb-1 flex flex-wrap items-center gap-1.5">
                <span className={`${chip} bg-ink-700 text-muted`}>option</span>
                {o.option && <span className={`${chip} bg-ink-700 text-muted`}>{o.option.kind}</span>}
                <Prov value={o.provenance} />
                <Standing value={o.standing} />
                <span className="text-[12px] text-white">
                  {o.option?.name ?? o.option?.optionSlug ?? o.assertion}
                </span>
              </div>
              {o.option?.whenToUse && (
                <p className="text-[11px] text-muted">when: {o.option.whenToUse}</p>
              )}
              {!o.option && <p className="text-[11px] text-muted">{o.assertion}</p>}
            </div>
          ))}

          {rulings.map((r) => (
            <div key={r.id} className="rounded-lg border border-ink-700 bg-ink-900/40 p-3">
              <div className="mb-1 flex flex-wrap items-center gap-1.5">
                <span className={`${chip} bg-ink-700 text-muted`}>ruling</span>
                {r.rulingKind && (
                  <span className={`${chip} bg-ink-700 text-muted`}>{r.rulingKind}</span>
                )}
                <Prov value={r.provenance} />
                <Standing value={r.standing} />
              </div>
              <p className="text-[12px] text-white">{r.assertion}</p>
              {r.reasoning && <p className="mt-0.5 text-[11px] text-muted">{r.reasoning}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
