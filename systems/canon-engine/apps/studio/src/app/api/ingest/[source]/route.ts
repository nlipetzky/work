import { getClient } from '@/lib/client';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ source: string }> },
) {
  const { source } = await params;
  const client = getClient();

  try {
    let result;
    if (source === 'emails') result = await client.ingest.emails();
    else if (source === 'transcripts') result = await client.ingest.transcripts();
    else if (source === 'documents') result = await client.ingest.documents();
    else if (source === 'all') result = await client.ingest.all();
    else return NextResponse.json({ error: `Unknown source: ${source}` }, { status: 400 });

    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
