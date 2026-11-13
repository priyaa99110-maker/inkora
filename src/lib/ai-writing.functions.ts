import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const REWRITE_STYLES = [
  "Formal",
  "Casual",
  "Friendly",
  "Romantic",
  "Inspirational",
  "Storytelling",
  "Professional",
  "Reflective",
  "Minimal",
  "Creative",
  "Elegant",
  "Poetic",
] as const;

export const EMOTIONAL_TONES = [
  "Happy",
  "Calm",
  "Peaceful",
  "Sad",
  "Hopeful",
  "Motivational",
  "Grateful",
  "Excited",
  "Reflective",
  "Nostalgic",
  "Heartfelt",
  "Confident",
] as const;

const InputSchema = z.object({
  text: z.string().trim().min(1, "Nothing to work with yet").max(20000),
  action: z.enum(["autoformat", "style", "tone"]),
  option: z.string().trim().max(40).optional(),
});

function buildPrompt(action: string, option: string | undefined) {
  if (action === "autoformat") {
    return [
      "You are a careful copy editor for a personal journal.",
      "Fix grammar, punctuation, capitalization and sentence structure.",
      "Improve paragraph spacing by grouping related sentences into paragraphs.",
      "Preserve the author's voice, meaning and every personal detail. Do not add new ideas.",
    ].join(" ");
  }
  if (action === "style") {
    return `Rewrite the journal entry in a ${option ?? "Reflective"} writing style. Keep every fact and personal detail intact, keep it first-person, and keep a similar length.`;
  }
  return `Rewrite the journal entry so it carries a ${option ?? "Calm"} emotional tone. Keep every fact and personal detail intact, keep it first-person, and keep a similar length.`;
}

export const rewriteJournalText = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI is not configured for this project yet.");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-5.6-sol",
        reasoning_effort: "none",
        messages: [
          {
            role: "system",
            content: `${buildPrompt(data.action, data.option)} Reply with the rewritten entry only — plain text with blank lines between paragraphs, no commentary, no markdown fences.`,
          },
          { role: "user", content: data.text },
        ],
      }),
    });

    if (response.status === 429) {
      throw new Error("The writing assistant is busy right now. Please try again in a moment.");
    }
    if (response.status === 402) {
      throw new Error("AI credits are exhausted. Add credits to keep using the assistant.");
    }
    if (!response.ok) {
      const detail = await response.text();
      console.error("AI gateway error", response.status, detail);
      throw new Error("The writing assistant could not finish that request.");
    }

    const json = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const result = json.choices?.[0]?.message?.content?.trim();
    if (!result) throw new Error("The writing assistant returned an empty result.");
    return { result };
  });