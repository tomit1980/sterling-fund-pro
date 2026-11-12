// @vitest-environment node
import "../db-setup";
import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { sha256 } from "@/lib/auth/crypto";
import { TOKEN_TTL_MS, consumeToken, issueToken } from "@/lib/auth/tokens";

const DOMAIN = "@tokens.test";

async function makeUser(email = `tokens${DOMAIN}`) {
  return prisma.user.create({ data: { email, name: "Token Tester", passwordHash: "x" } });
}

describe("verification tokens", () => {
  beforeEach(async () => {
    await prisma.user.deleteMany({ where: { email: { endsWith: DOMAIN } } });
  });

  it("issues a hashed single-use token with the right TTL", async () => {
    const user = await makeUser();
    const before = Date.now();
    const issued = await issueToken(user.id, "EMAIL_VERIFY");
    expect(issued.token.length).toBeGreaterThanOrEqual(40);
    expect(issued.expiresAt.getTime() - before).toBeGreaterThanOrEqual(TOKEN_TTL_MS.EMAIL_VERIFY - 1000);

    const row = await prisma.verificationToken.findFirstOrThrow({ where: { userId: user.id } });
    expect(row.tokenHash).toBe(sha256(issued.token));
    expect(row.tokenHash).not.toContain(issued.token);

    expect(await consumeToken(issued.token, "EMAIL_VERIFY")).toEqual({ userId: user.id });
    // second use fails
    expect(await consumeToken(issued.token, "EMAIL_VERIFY")).toBeNull();
  });

  it("rejects wrong type, unknown and expired tokens", async () => {
    const user = await makeUser();
    const reset = await issueToken(user.id, "PASSWORD_RESET");
    expect(await consumeToken(reset.token, "EMAIL_VERIFY")).toBeNull();
    expect(await consumeToken("definitely-not-a-token-value", "PASSWORD_RESET")).toBeNull();

    const later = new Date(Date.now() + TOKEN_TTL_MS.PASSWORD_RESET + 1000);
    expect(await consumeToken(reset.token, "PASSWORD_RESET", later)).toBeNull();
    // still unused, so it works at the current time
    expect(await consumeToken(reset.token, "PASSWORD_RESET")).toEqual({ userId: user.id });
  });

  it("consuming one token invalidates the user's other tokens of that type only", async () => {
    const user = await makeUser();
    const other = await makeUser(`other${DOMAIN}`);
    const first = await issueToken(user.id, "PASSWORD_RESET");
    const second = await issueToken(user.id, "PASSWORD_RESET");
    const verify = await issueToken(user.id, "EMAIL_VERIFY");
    const otherReset = await issueToken(other.id, "PASSWORD_RESET");

    expect(await consumeToken(second.token, "PASSWORD_RESET")).toEqual({ userId: user.id });
    expect(await consumeToken(first.token, "PASSWORD_RESET")).toBeNull();
    expect(await consumeToken(verify.token, "EMAIL_VERIFY")).toEqual({ userId: user.id });
    expect(await consumeToken(otherReset.token, "PASSWORD_RESET")).toEqual({ userId: other.id });
  });
});
