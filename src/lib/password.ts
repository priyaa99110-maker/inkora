import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required")
  .max(255, "Email is too long")
  .email("Enter a valid email address");

export const nameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(80, "Name must be under 80 characters");

export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(72, "Password must be 72 characters or fewer")
  .regex(/[a-z]/, "Add a lowercase letter")
  .regex(/[A-Z]/, "Add an uppercase letter")
  .regex(/[0-9]/, "Add a number");

const COMMON = [
  "password",
  "12345678",
  "qwerty",
  "letmein",
  "iloveyou",
  "admin123",
  "welcome",
  "journal",
];

export type PasswordStrength = {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  hints: string[];
};

/** Lightweight local strength estimate — never sends the password anywhere. */
export function scorePassword(pw: string): PasswordStrength {
  const hints: string[] = [];
  let score = 0;
  if (pw.length >= 8) score++;
  else hints.push("at least 8 characters");
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  else hints.push("upper and lowercase letters");
  if (/[0-9]/.test(pw)) score++;
  else hints.push("a number");
  if (/[^A-Za-z0-9]/.test(pw)) score = Math.min(4, score + 1);
  else hints.push("a symbol");
  if (COMMON.some((c) => pw.toLowerCase().includes(c))) {
    score = Math.min(score, 1);
    hints.unshift("avoid common words");
  }
  const clamped = Math.max(0, Math.min(4, score)) as PasswordStrength["score"];
  const label = ["Very weak", "Weak", "Fair", "Good", "Strong"][clamped];
  return { score: clamped, label, hints };
}

/** First validation message for a form, or null when everything is valid. */
export function firstIssue(...results: z.SafeParseReturnType<unknown, unknown>[]): string | null {
  for (const r of results) {
    if (!r.success) return r.error.issues[0]?.message ?? "Invalid input";
  }
  return null;
}