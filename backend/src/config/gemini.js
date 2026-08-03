import dotenv from 'dotenv';
dotenv.config();

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent';

const SYSTEM_PROMPT = `You are "Manifest Bro" — the AI coach inside a manifestation app called Manifest.
Your vibe: hype best friend energy, not a therapist. Casual, punchy, a little cheeky, Gen Z coded.
Use phrases like "bro", "let's manifest that", "the universe is listening", "lock in" naturally — don't overdo it every line.
Keep replies SHORT (2-5 sentences max). No long paragraphs, no numbered lists unless truly needed.
When someone shares a desire (money, a car, a relationship, a job), hype them up first, THEN give one small
concrete action tied to this app (write an affirmation, add it to their vision board, log today's proof, journal it 369-style).
If you're given their actual goals/journal/affirmations as context, reference them specifically — don't be generic.
Never be preachy, clinical, or use therapy-speak like "I hear that you're feeling...". Just be a hype bro who
also happens to give genuinely good, actionable manifestation advice.`;

export async function askManifestBro(history, contextBlock) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set');
  }

  const contents = history.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      systemInstruction: {
        parts: [{ text: `${SYSTEM_PROMPT}\n\nHere's what you know about this user right now:\n${contextBlock}` }],
      },
      generationConfig: {
        temperature: 0.9,
        maxOutputTokens: 300,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned no text');
  return text.trim();
}

// Phase 2: on dream creation, auto-generate a starting set of affirmations
// and goals so the user never has to write them from scratch.
export async function generateDreamContent({ title, category, whyReason, lifeChange }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set');
  }

  const prompt = `A user wants to manifest this dream:
Title: ${title}
Category: ${category}
Why they want it: ${whyReason || 'not specified'}
How their life will change after achieving it: ${lifeChange || 'not specified'}

Generate:
1. Exactly 5 short, powerful first-person affirmations (present tense, "I am / I attract / I deserve" style) specific to this dream — not generic.
2. Exactly 7 concrete, actionable goals that would realistically help achieve this dream, ordered from foundational to advanced. Each goal needs a short title and a one-sentence description.

Respond ONLY with valid JSON, no markdown fences, no extra text, in exactly this shape:
{"affirmations": ["...", "...", "...", "...", "..."], "goals": [{"title": "...", "description": "..."}, {"title": "...", "description": "..."}, {"title": "...", "description": "..."}, {"title": "...", "description": "..."}, {"title": "...", "description": "..."}, {"title": "...", "description": "..."}, {"title": "...", "description": "..."}]}`;

  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 800,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned no content');

  const parsed = JSON.parse(text);
  return {
    affirmations: Array.isArray(parsed.affirmations) ? parsed.affirmations.slice(0, 5) : [],
    goals: Array.isArray(parsed.goals) ? parsed.goals.slice(0, 7) : [],
  };
}