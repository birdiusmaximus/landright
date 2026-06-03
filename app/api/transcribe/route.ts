import { NextRequest, NextResponse } from "next/server";
import OpenAI, { toFile } from "openai";

// Lazy client so the build never needs the key at module-load time.
let _client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!_client) _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _client;
}

// Cheap/accurate speech-to-text; falls back to the classic model if the newer
// one isn't available on the account.
const PRIMARY = "gpt-4o-mini-transcribe";
const FALLBACK = "whisper-1";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const audio = form.get("audio");
    if (!(audio instanceof Blob) || audio.size === 0) {
      return NextResponse.json({ success: false, error: "No audio received" }, { status: 400 });
    }
    if (audio.size > 24 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: "Recording too long" }, { status: 400 });
    }

    const name = (audio as File).name || "clip.webm";
    const type = audio.type || "audio/webm";
    const client = getClient();

    let text = "";
    try {
      const file = await toFile(audio, name, { type });
      const tr = await client.audio.transcriptions.create({ file, model: PRIMARY });
      text = (tr.text || "").trim();
    } catch {
      // Recreate the file (the Blob is re-readable) and retry on the classic model.
      const file = await toFile(audio, name, { type });
      const tr = await client.audio.transcriptions.create({ file, model: FALLBACK });
      text = (tr.text || "").trim();
    }

    return NextResponse.json({ success: true, text: text.slice(0, 500) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Transcription failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
