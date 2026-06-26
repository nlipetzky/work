import OpenAI from 'openai';

const MODEL = 'text-embedding-3-small';

let _client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!_client) _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _client;
}

export async function embedQuery(text: string): Promise<string> {
  const res = await getClient().embeddings.create({ model: MODEL, input: text });
  const vec = res.data[0].embedding;
  return JSON.stringify(vec);
}
