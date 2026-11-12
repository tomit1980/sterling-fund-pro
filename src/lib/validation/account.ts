import { z } from "zod";

/**
 * Account application answers. Deliberately NO identity documents, account numbers or TFNs:
 * onboarding captures structured declarations only, to be handed to an approved KYC provider later.
 */

export const profileSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  country: z.string().trim().max(60).optional().or(z.literal("")),
  addressLine: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().max(100).optional().or(z.literal("")),
  postcode: z.string().trim().max(20).optional().or(z.literal("")),
});
export type ProfileInput = z.infer<typeof profileSchema>;

const experience = z.enum(["NONE", "LIMITED", "MODERATE", "EXTENSIVE"]);
const sourceOfFunds = z.enum(["EMPLOYMENT", "BUSINESS", "INVESTMENTS", "SAVINGS", "INHERITANCE", "OTHER"]);
const fundingBand = z.enum(["UNDER_50K", "50K_250K", "250K_1M", "1M_5M", "OVER_5M"]);

const individualData = z.object({
  type: z.literal("INDIVIDUAL"),
  residencyCountry: z.string().trim().min(2).max(60),
  isTaxResidentOnlyIn: z.string().trim().min(2).max(60),
  employmentStatus: z.enum(["EMPLOYED", "SELF_EMPLOYED", "RETIRED", "STUDENT", "UNEMPLOYED", "OTHER"]),
  tradingExperience: experience,
  sourceOfFunds,
  intendedFunding: fundingBand,
  isPoliticallyExposed: z.boolean(),
  acceptsRiskDisclosure: z.literal(true, { message: "You must confirm you have read the risk disclosure" }),
});

const corporateData = z.object({
  type: z.literal("CORPORATE"),
  legalName: z.string().trim().min(2).max(200),
  registrationNumber: z.string().trim().min(3).max(60),
  countryOfIncorporation: z.string().trim().min(2).max(60),
  businessNature: z.string().trim().min(3).max(300),
  authorisedRepresentatives: z
    .array(
      z.object({
        name: z.string().trim().min(2).max(100),
        role: z.string().trim().min(2).max(100),
        email: z.string().trim().toLowerCase().email(),
      }),
    )
    .min(1, "Add at least one authorised representative")
    .max(10),
  beneficialOwnersOver25pct: z.number().int().min(0).max(20),
  intendedFunding: fundingBand,
  tradingPurpose: z.enum(["TREASURY", "HEDGING", "PROPRIETARY", "INVESTMENT", "OTHER"]),
  isPoliticallyExposed: z.boolean(),
  acceptsRiskDisclosure: z.literal(true, { message: "You must confirm you have read the risk disclosure" }),
});

const smsfData = z.object({
  type: z.literal("SMSF"),
  fundName: z.string().trim().min(2).max(200),
  trusteeType: z.enum(["INDIVIDUAL_TRUSTEES", "CORPORATE_TRUSTEE"]),
  corporateTrusteeName: z.string().trim().max(200).optional().or(z.literal("")),
  trustees: z
    .array(z.object({ name: z.string().trim().min(2).max(100), email: z.string().trim().toLowerCase().email() }))
    .min(1, "Add at least one trustee")
    .max(6),
  memberCount: z.number().int().min(1).max(6),
  hasInvestmentStrategyPermittingTrading: z.boolean(),
  fundRegisteredWithRegulator: z.boolean(),
  intendedFunding: fundingBand,
  isPoliticallyExposed: z.boolean(),
  acceptsRiskDisclosure: z.literal(true, { message: "You must confirm you have read the risk disclosure" }),
  acknowledgesTrusteeResponsibility: z.literal(true, {
    message: "Trustees must confirm they understand their responsibilities",
  }),
});

export const applicationDataSchema = z.discriminatedUnion("type", [individualData, corporateData, smsfData]);
export type ApplicationData = z.infer<typeof applicationDataSchema>;

export const applicationSubmitSchema = z.object({
  data: applicationDataSchema,
});

export const applicationReviewSchema = z.object({
  status: z.enum(["UNDER_REVIEW", "MORE_INFO", "APPROVED", "REJECTED"]),
  notes: z.string().trim().max(2000).optional(),
});
