import bcrypt from "bcryptjs";

const BCRYPT_COST = 12;

/** Small deny-list of very common passwords; the Zod schema also enforces length/complexity. */
const COMMON_PASSWORDS = new Set([
  "password",
  "password1",
  "password123",
  "123456789",
  "1234567890",
  "qwertyuiop",
  "letmein123",
  "welcome123",
  "iloveyou1",
  "admin12345",
  "trading123",
  "sterling123",
]);

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_COST);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(plain, hash);
  } catch {
    return false;
  }
}

export interface PasswordCheck {
  ok: boolean;
  problems: string[];
}

/** Policy: >= 10 chars, at least one letter and one digit, not in the common list, no long repeats. */
export function checkPasswordPolicy(plain: string, context: string[] = []): PasswordCheck {
  const problems: string[] = [];
  if (plain.length < 10) problems.push("Use at least 10 characters.");
  if (plain.length > 128) problems.push("Use at most 128 characters.");
  if (!/[a-zA-Z]/.test(plain)) problems.push("Include at least one letter.");
  if (!/\d/.test(plain)) problems.push("Include at least one number.");
  if (COMMON_PASSWORDS.has(plain.toLowerCase())) problems.push("That password is too common.");
  if (/(.)\1{4,}/.test(plain)) problems.push("Avoid long runs of the same character.");
  const lowered = plain.toLowerCase();
  for (const c of context) {
    const token = c.toLowerCase().split("@")[0];
    if (token.length >= 4 && lowered.includes(token)) {
      problems.push("Don't include your name or email in the password.");
      break;
    }
  }
  return { ok: problems.length === 0, problems };
}
