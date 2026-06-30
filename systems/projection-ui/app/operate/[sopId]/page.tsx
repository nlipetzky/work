import { Suspense } from "react";
import { notFound } from "next/navigation";
import { detailById } from "@/lib/queries/operatingSop";
import { OperateCockpit } from "@/components/operate/OperateCockpit";

// Server component: fetch the SopDetail once on the server (detailById does the
// L3 live reads), then hand it to the client <OperateCockpit> island which owns
// URL state (?mode/stage/node), selection, editing, and run/spawn wiring.
// The Suspense boundary is required because OperateCockpit reads useSearchParams.

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ sopId: string }>;
}) {
  const { sopId } = await params;
  const detail = await detailById(sopId);
  if (!detail) notFound();

  return (
    <Suspense fallback={<main className="p-6 text-muted">Loading…</main>}>
      <OperateCockpit data={detail} sopId={sopId} />
    </Suspense>
  );
}
