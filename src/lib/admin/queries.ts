/**
 * Read models shared by the admin API routes and the admin pages. Callers must have already
 * enforced the role check (requireRole / requireRolePage).
 */
import { z } from "zod";
import type { ApplicationStatus, ConversationStatus, Prisma, Role, UserStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});
export type Pagination = z.infer<typeof paginationSchema>;

export interface Paged<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

function paged<T>(items: T[], total: number, p: Pagination): Paged<T> {
  return { items, page: p.page, pageSize: p.pageSize, total, totalPages: Math.max(1, Math.ceil(total / p.pageSize)) };
}

// ---------- Users ----------

export const userListQuerySchema = paginationSchema.extend({
  q: z.string().trim().max(100).optional(),
  role: z.enum(["USER", "SUPPORT", "ADMIN"]).optional(),
  status: z.enum(["ACTIVE", "SUSPENDED"]).optional(),
});
export type UserListQuery = z.infer<typeof userListQuerySchema>;

export const adminUserSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  status: true,
  emailVerifiedAt: true,
  mfaEnabled: true,
  lockedUntil: true,
  createdAt: true,
  _count: { select: { applications: true, sessions: true } },
} satisfies Prisma.UserSelect;

export type AdminUserRow = Prisma.UserGetPayload<{ select: typeof adminUserSelect }>;

export async function listUsers(query: UserListQuery): Promise<Paged<AdminUserRow>> {
  const where: Prisma.UserWhereInput = {
    ...(query.q ? { OR: [{ email: { contains: query.q, mode: "insensitive" } }, { name: { contains: query.q, mode: "insensitive" } }] } : {}),
    ...(query.role ? { role: query.role as Role } : {}),
    ...(query.status ? { status: query.status as UserStatus } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.user.findMany({ where, select: adminUserSelect, orderBy: { createdAt: "desc" }, skip: (query.page - 1) * query.pageSize, take: query.pageSize }),
    prisma.user.count({ where }),
  ]);
  return paged(items, total, query);
}

export const userUpdateSchema = z
  .object({
    role: z.enum(["USER", "SUPPORT", "ADMIN"]).optional(),
    status: z.enum(["ACTIVE", "SUSPENDED"]).optional(),
  })
  .refine((d) => d.role !== undefined || d.status !== undefined, { message: "Nothing to update" });
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;

// ---------- Applications ----------

export const applicationListQuerySchema = paginationSchema.extend({
  status: z.enum(["DRAFT", "SUBMITTED", "UNDER_REVIEW", "MORE_INFO", "APPROVED", "REJECTED"]).optional(),
  type: z.enum(["INDIVIDUAL", "CORPORATE", "SMSF"]).optional(),
});
export type ApplicationListQuery = z.infer<typeof applicationListQuerySchema>;

export const applicationListSelect = {
  id: true,
  type: true,
  status: true,
  submittedAt: true,
  decisionAt: true,
  createdAt: true,
  updatedAt: true,
  user: { select: { id: true, name: true, email: true } },
  reviewedBy: { select: { id: true, name: true } },
} satisfies Prisma.AccountApplicationSelect;
export type ApplicationRow = Prisma.AccountApplicationGetPayload<{ select: typeof applicationListSelect }>;

export async function listApplications(query: ApplicationListQuery): Promise<Paged<ApplicationRow>> {
  const where: Prisma.AccountApplicationWhereInput = {
    ...(query.status ? { status: query.status as ApplicationStatus } : {}),
    ...(query.type ? { type: query.type } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.accountApplication.findMany({
      where,
      select: applicationListSelect,
      orderBy: [{ submittedAt: "desc" }, { createdAt: "desc" }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.accountApplication.count({ where }),
  ]);
  return paged(items, total, query);
}

export const applicationDetailSelect = {
  ...applicationListSelect,
  data: true,
  reviewNotes: true,
  user: { select: { id: true, name: true, email: true, createdAt: true, profile: { select: { phone: true, country: true, city: true } } } },
} satisfies Prisma.AccountApplicationSelect;
export type ApplicationDetail = Prisma.AccountApplicationGetPayload<{ select: typeof applicationDetailSelect }>;

export async function getApplication(id: string): Promise<ApplicationDetail | null> {
  return prisma.accountApplication.findUnique({ where: { id }, select: applicationDetailSelect });
}

// ---------- Support inbox ----------

export const inboxQuerySchema = paginationSchema.extend({
  status: z.enum(["OPEN", "PENDING", "CLOSED", "ALL"]).default("OPEN"),
  channel: z.enum(["CONTACT_FORM", "LIVE_CHAT"]).optional(),
});
export type InboxQuery = z.infer<typeof inboxQuerySchema>;

export const inboxSelect = {
  id: true,
  channel: true,
  status: true,
  subject: true,
  topic: true,
  guestName: true,
  guestEmail: true,
  createdAt: true,
  lastMessageAt: true,
  closedAt: true,
  user: { select: { id: true, name: true, email: true } },
  _count: { select: { messages: true } },
  messages: { orderBy: { createdAt: "desc" as const }, take: 1, select: { body: true, senderType: true, createdAt: true } },
} satisfies Prisma.SupportConversationSelect;
export type InboxRow = Prisma.SupportConversationGetPayload<{ select: typeof inboxSelect }>;

export async function listConversations(query: InboxQuery): Promise<Paged<InboxRow>> {
  const where: Prisma.SupportConversationWhereInput = {
    ...(query.status !== "ALL" ? { status: query.status as ConversationStatus } : {}),
    ...(query.channel ? { channel: query.channel } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.supportConversation.findMany({ where, select: inboxSelect, orderBy: { lastMessageAt: "desc" }, skip: (query.page - 1) * query.pageSize, take: query.pageSize }),
    prisma.supportConversation.count({ where }),
  ]);
  return paged(items, total, query);
}

export const threadSelect = {
  id: true,
  channel: true,
  status: true,
  subject: true,
  topic: true,
  guestName: true,
  guestEmail: true,
  createdAt: true,
  lastMessageAt: true,
  closedAt: true,
  user: { select: { id: true, name: true, email: true, role: true } },
  messages: {
    orderBy: { createdAt: "asc" as const },
    select: { id: true, senderType: true, body: true, createdAt: true, senderUser: { select: { id: true, name: true } } },
  },
} satisfies Prisma.SupportConversationSelect;
export type Thread = Prisma.SupportConversationGetPayload<{ select: typeof threadSelect }>;

export async function getThread(id: string): Promise<Thread | null> {
  return prisma.supportConversation.findUnique({ where: { id }, select: threadSelect });
}

// ---------- Audit log ----------

export const auditQuerySchema = paginationSchema.extend({
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
  action: z.string().trim().max(100).optional(),
  actor: z.string().trim().max(254).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});
export type AuditQuery = z.infer<typeof auditQuerySchema>;

export const auditSelect = {
  id: true,
  action: true,
  targetType: true,
  targetId: true,
  ip: true,
  metadata: true,
  createdAt: true,
  actor: { select: { id: true, email: true, name: true } },
} satisfies Prisma.AuditLogSelect;
export type AuditRow = Prisma.AuditLogGetPayload<{ select: typeof auditSelect }>;

export async function listAudit(query: AuditQuery): Promise<Paged<AuditRow>> {
  const where: Prisma.AuditLogWhereInput = {
    ...(query.action ? { action: { startsWith: query.action } } : {}),
    ...(query.actor ? { actor: { OR: [{ email: { contains: query.actor, mode: "insensitive" } }, { id: query.actor }] } } : {}),
    ...(query.from || query.to ? { createdAt: { ...(query.from ? { gte: query.from } : {}), ...(query.to ? { lte: query.to } : {}) } } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({ where, select: auditSelect, orderBy: { createdAt: "desc" }, skip: (query.page - 1) * query.pageSize, take: query.pageSize }),
    prisma.auditLog.count({ where }),
  ]);
  return paged(items, total, query);
}

// ---------- Overview stats ----------

export interface AdminStats {
  users: { total: number; verified: number; suspended: number; newLast7d: number };
  applications: { total: number; pending: number; approved: number; rejected: number };
  support: { open: number; pending: number; closedLast7d: number; agentsOnline: number };
  audit: { last24h: number; loginFailuresLast24h: number };
  generatedAt: string;
}

export async function getAdminStats(now = new Date()): Promise<AdminStats> {
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const presenceCutoff = new Date(now.getTime() - 5 * 60 * 1000);
  const [
    totalUsers,
    verifiedUsers,
    suspendedUsers,
    newUsers,
    totalApps,
    pendingApps,
    approvedApps,
    rejectedApps,
    openConv,
    pendingConv,
    closedConv,
    agentsOnline,
    auditLast24h,
    loginFailures,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { emailVerifiedAt: { not: null } } }),
    prisma.user.count({ where: { status: "SUSPENDED" } }),
    prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.accountApplication.count(),
    prisma.accountApplication.count({ where: { status: { in: ["SUBMITTED", "UNDER_REVIEW", "MORE_INFO"] } } }),
    prisma.accountApplication.count({ where: { status: "APPROVED" } }),
    prisma.accountApplication.count({ where: { status: "REJECTED" } }),
    prisma.supportConversation.count({ where: { status: "OPEN" } }),
    prisma.supportConversation.count({ where: { status: "PENDING" } }),
    prisma.supportConversation.count({ where: { status: "CLOSED", closedAt: { gte: weekAgo } } }),
    prisma.agentPresence.count({ where: { lastSeenAt: { gte: presenceCutoff }, user: { role: { in: ["SUPPORT", "ADMIN"] } } } }),
    prisma.auditLog.count({ where: { createdAt: { gte: dayAgo } } }),
    prisma.auditLog.count({ where: { createdAt: { gte: dayAgo }, action: { in: ["auth.login.failure", "auth.login.locked"] } } }),
  ]);
  return {
    users: { total: totalUsers, verified: verifiedUsers, suspended: suspendedUsers, newLast7d: newUsers },
    applications: { total: totalApps, pending: pendingApps, approved: approvedApps, rejected: rejectedApps },
    support: { open: openConv, pending: pendingConv, closedLast7d: closedConv, agentsOnline },
    audit: { last24h: auditLast24h, loginFailuresLast24h: loginFailures },
    generatedAt: now.toISOString(),
  };
}
