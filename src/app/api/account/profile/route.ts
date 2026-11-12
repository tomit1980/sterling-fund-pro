import { ApiError, assertSameOrigin, clientIp, handler, ok, parseBody } from "@/lib/api";
import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { RATE_LIMITS, enforceRateLimit } from "@/lib/rate-limit";
import { profileSchema } from "@/lib/validation/account";

const profileSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  emailVerifiedAt: true,
  mfaEnabled: true,
  createdAt: true,
  profile: { select: { phone: true, country: true, addressLine: true, city: true, postcode: true, updatedAt: true } },
} as const;

function serialize(u: { id: string; email: string; name: string; role: string; emailVerifiedAt: Date | null; mfaEnabled: boolean; createdAt: Date; profile: { phone: string | null; country: string | null; addressLine: string | null; city: string | null; postcode: string | null; updatedAt: Date } | null }) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    emailVerified: Boolean(u.emailVerifiedAt),
    mfaEnabled: u.mfaEnabled,
    createdAt: u.createdAt.toISOString(),
    phone: u.profile?.phone ?? "",
    country: u.profile?.country ?? "",
    addressLine: u.profile?.addressLine ?? "",
    city: u.profile?.city ?? "",
    postcode: u.profile?.postcode ?? "",
    updatedAt: u.profile?.updatedAt.toISOString() ?? null,
  };
}

export const GET = handler(async () => {
  const user = await requireUser();
  const row = await prisma.user.findUnique({ where: { id: user.id }, select: profileSelect });
  if (!row) throw new ApiError(404, "NOT_FOUND", "Account not found");
  return ok({ profile: serialize(row) });
});

export const PUT = handler(async (req) => {
  assertSameOrigin(req);
  const user = await requireUser();
  await enforceRateLimit(RATE_LIMITS.generic, `profile:${user.id}`);
  const body = await parseBody(req, profileSchema);
  const clean = (v: string | undefined) => (v && v.length > 0 ? v : null);

  const row = await prisma.user.update({
    where: { id: user.id },
    data: {
      name: body.name,
      profile: {
        upsert: {
          create: { phone: clean(body.phone), country: clean(body.country), addressLine: clean(body.addressLine), city: clean(body.city), postcode: clean(body.postcode) },
          update: { phone: clean(body.phone), country: clean(body.country), addressLine: clean(body.addressLine), city: clean(body.city), postcode: clean(body.postcode) },
        },
      },
    },
    select: profileSelect,
  });
  await audit({ actorUserId: user.id, action: "account.profile.update", targetType: "User", targetId: user.id, ip: clientIp(req) });
  return ok({ profile: serialize(row) });
});
