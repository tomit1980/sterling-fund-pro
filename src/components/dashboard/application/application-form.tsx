"use client";

import * as React from "react";
import { useFieldArray, useForm, useWatch, type FieldErrors, type Path, type UseFormRegister } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash } from "lucide-react";
import { Alert, Button, Checkbox, FormField, Input, Select, Textarea } from "@/components/ui";
import { applicationDataSchema, type ApplicationData } from "@/lib/validation/account";
import { apiFetch, ClientApiError } from "../api-client";

export type ApplicationType = ApplicationData["type"];
type IndividualData = Extract<ApplicationData, { type: "INDIVIDUAL" }>;
type CorporateData = Extract<ApplicationData, { type: "CORPORATE" }>;
type SmsfData = Extract<ApplicationData, { type: "SMSF" }>;

const [individualSchema, corporateSchema, smsfSchema] = applicationDataSchema.options;

export interface ApplicationRecord {
  id: string;
  type: ApplicationType;
  status: "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "MORE_INFO" | "APPROVED" | "REJECTED";
  data: unknown;
  submittedAt: string | null;
  reviewNotes: string | null;
  decisionAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApplicationFormProps {
  type: ApplicationType;
  /** Existing answers (MORE_INFO resubmission) — only used when `data.type === type`. */
  initial?: unknown;
  onSubmitted: (app: ApplicationRecord) => void;
}

/** Form values are typed as the schema output; boolean literals start unchecked. */
const unchecked = false as unknown as true;

const EXPERIENCE = [
  ["NONE", "None"],
  ["LIMITED", "Limited (under 1 year)"],
  ["MODERATE", "Moderate (1–5 years)"],
  ["EXTENSIVE", "Extensive (5+ years)"],
] as const;
const SOURCE_OF_FUNDS = [
  ["EMPLOYMENT", "Employment income"],
  ["BUSINESS", "Business income"],
  ["INVESTMENTS", "Investment returns"],
  ["SAVINGS", "Savings"],
  ["INHERITANCE", "Inheritance / gift"],
  ["OTHER", "Other"],
] as const;
const FUNDING = [
  ["UNDER_50K", "Under $50,000"],
  ["50K_250K", "$50,000 – $250,000"],
  ["250K_1M", "$250,000 – $1,000,000"],
  ["1M_5M", "$1,000,000 – $5,000,000"],
  ["OVER_5M", "Over $5,000,000"],
] as const;
const EMPLOYMENT = [
  ["EMPLOYED", "Employed"],
  ["SELF_EMPLOYED", "Self-employed"],
  ["RETIRED", "Retired"],
  ["STUDENT", "Student"],
  ["UNEMPLOYED", "Not currently employed"],
  ["OTHER", "Other"],
] as const;
const PURPOSE = [
  ["TREASURY", "Treasury management"],
  ["HEDGING", "Hedging"],
  ["PROPRIETARY", "Proprietary trading"],
  ["INVESTMENT", "Long-term investment"],
  ["OTHER", "Other"],
] as const;

function Options({ items }: { items: ReadonlyArray<readonly [string, string]> }) {
  return (
    <>
      <option value="">Select…</option>
      {items.map(([v, l]) => (
        <option key={v} value={v}>
          {l}
        </option>
      ))}
    </>
  );
}

async function submit<T extends ApplicationData>(data: T, setError: (name: Path<T>, err: { message: string }) => void): Promise<ApplicationRecord> {
  try {
    const res = await apiFetch<{ application: ApplicationRecord }>("/api/account/application", { method: "POST", json: { data } });
    return res.application;
  } catch (e) {
    if (e instanceof ClientApiError && e.fieldErrors) {
      for (const [k, msgs] of Object.entries(e.fieldErrors)) {
        const name = k.replace(/^data\./, "") as Path<T>;
        setError(name, { message: msgs[0] });
      }
    }
    throw e;
  }
}

function Declarations<T extends ApplicationData>({ register, errors, extra }: { register: UseFormRegister<T>; errors: FieldErrors<T>; extra?: React.ReactNode }) {
  const r = register as unknown as UseFormRegister<IndividualData>;
  const e = errors as FieldErrors<IndividualData>;
  return (
    <fieldset className="space-y-3 rounded-md border border-line bg-surface-2/40 p-4">
      <legend className="px-1 text-sm font-medium text-ink-900">Declarations</legend>
      <Checkbox label="I am, or a close associate is, a politically exposed person (PEP)." {...r("isPoliticallyExposed")} />
      <div>
        <Checkbox
          label={
            <>
              I have read and understood the{" "}
              <a href="/legal/risk-disclaimer" target="_blank" rel="noopener" className="text-brand-400 underline">
                risk disclosure
              </a>
              . Trading involves the risk of loss.
            </>
          }
          {...r("acceptsRiskDisclosure")}
        />
        {e.acceptsRiskDisclosure && (
          <p className="mt-1 text-xs text-down-500" role="alert">
            {e.acceptsRiskDisclosure.message as string}
          </p>
        )}
      </div>
      {extra}
    </fieldset>
  );
}

function SubmitRow({ submitting, error }: { submitting: boolean; error: string | null }) {
  return (
    <div className="space-y-3">
      {error && <Alert tone="error">{error}</Alert>}
      <p className="text-xs text-ink-500">
        Submitting records a structured declaration only. Identity verification (KYC) is completed separately with an approved provider before any account is activated.
      </p>
      <Button type="submit" loading={submitting}>
        Submit application
      </Button>
    </div>
  );
}

function isType<T extends ApplicationType>(initial: unknown, type: T): initial is Extract<ApplicationData, { type: T }> {
  return typeof initial === "object" && initial !== null && (initial as { type?: string }).type === type;
}

// ---------- Individual ----------

export function IndividualForm({ initial, onSubmitted }: Omit<ApplicationFormProps, "type">) {
  const [error, setError] = React.useState<string | null>(null);
  const form = useForm<IndividualData>({
    resolver: zodResolver(individualSchema),
    defaultValues: isType(initial, "INDIVIDUAL")
      ? initial
      : {
          type: "INDIVIDUAL",
          residencyCountry: "",
          isTaxResidentOnlyIn: "",
          employmentStatus: undefined,
          tradingExperience: undefined,
          sourceOfFunds: undefined,
          intendedFunding: undefined,
          isPoliticallyExposed: false,
          acceptsRiskDisclosure: unchecked,
        },
  });
  const { register, handleSubmit, formState } = form;
  const errors = formState.errors;
  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      onSubmitted(await submit(values, form.setError));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submission failed");
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate data-testid="application-form-individual">
      <input type="hidden" {...register("type")} value="INDIVIDUAL" />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Country of residence" htmlFor="ind-res" error={errors.residencyCountry?.message} required>
          <Input id="ind-res" autoComplete="country-name" {...register("residencyCountry")} />
        </FormField>
        <FormField label="Tax residency (country)" htmlFor="ind-tax" error={errors.isTaxResidentOnlyIn?.message} required hint="Country where you are solely tax resident.">
          <Input id="ind-tax" {...register("isTaxResidentOnlyIn")} />
        </FormField>
        <FormField label="Employment status" htmlFor="ind-emp" error={errors.employmentStatus?.message} required>
          <Select id="ind-emp" {...register("employmentStatus")}>
            <Options items={EMPLOYMENT} />
          </Select>
        </FormField>
        <FormField label="Trading experience" htmlFor="ind-exp" error={errors.tradingExperience?.message} required>
          <Select id="ind-exp" {...register("tradingExperience")}>
            <Options items={EXPERIENCE} />
          </Select>
        </FormField>
        <FormField label="Source of funds" htmlFor="ind-sof" error={errors.sourceOfFunds?.message} required>
          <Select id="ind-sof" {...register("sourceOfFunds")}>
            <Options items={SOURCE_OF_FUNDS} />
          </Select>
        </FormField>
        <FormField label="Intended funding" htmlFor="ind-fund" error={errors.intendedFunding?.message} required>
          <Select id="ind-fund" {...register("intendedFunding")}>
            <Options items={FUNDING} />
          </Select>
        </FormField>
      </div>
      <Declarations register={register} errors={errors} />
      <SubmitRow submitting={formState.isSubmitting} error={error} />
    </form>
  );
}

// ---------- Corporate ----------

export function CorporateForm({ initial, onSubmitted }: Omit<ApplicationFormProps, "type">) {
  const [error, setError] = React.useState<string | null>(null);
  const form = useForm<CorporateData>({
    resolver: zodResolver(corporateSchema),
    defaultValues: isType(initial, "CORPORATE")
      ? initial
      : {
          type: "CORPORATE",
          legalName: "",
          registrationNumber: "",
          countryOfIncorporation: "",
          businessNature: "",
          authorisedRepresentatives: [{ name: "", role: "", email: "" }],
          beneficialOwnersOver25pct: 0,
          intendedFunding: undefined,
          tradingPurpose: undefined,
          isPoliticallyExposed: false,
          acceptsRiskDisclosure: unchecked,
        },
  });
  const { register, handleSubmit, formState, control } = form;
  const errors = formState.errors;
  const reps = useFieldArray({ control, name: "authorisedRepresentatives" });
  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      onSubmitted(await submit(values, form.setError));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submission failed");
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate data-testid="application-form-corporate">
      <input type="hidden" {...register("type")} value="CORPORATE" />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Legal entity name" htmlFor="co-name" error={errors.legalName?.message} required className="sm:col-span-2">
          <Input id="co-name" autoComplete="organization" {...register("legalName")} />
        </FormField>
        <FormField label="Registration number (ACN / ABN / other)" htmlFor="co-reg" error={errors.registrationNumber?.message} required>
          <Input id="co-reg" {...register("registrationNumber")} />
        </FormField>
        <FormField label="Country of incorporation" htmlFor="co-country" error={errors.countryOfIncorporation?.message} required>
          <Input id="co-country" {...register("countryOfIncorporation")} />
        </FormField>
        <FormField label="Nature of business" htmlFor="co-nature" error={errors.businessNature?.message} required className="sm:col-span-2">
          <Textarea id="co-nature" rows={3} {...register("businessNature")} />
        </FormField>
        <FormField label="Beneficial owners holding over 25%" htmlFor="co-ubo" error={errors.beneficialOwnersOver25pct?.message} required hint="Number of natural persons.">
          <Input id="co-ubo" type="number" min={0} max={20} {...register("beneficialOwnersOver25pct", { valueAsNumber: true })} />
        </FormField>
        <FormField label="Trading purpose" htmlFor="co-purpose" error={errors.tradingPurpose?.message} required>
          <Select id="co-purpose" {...register("tradingPurpose")}>
            <Options items={PURPOSE} />
          </Select>
        </FormField>
        <FormField label="Intended funding" htmlFor="co-fund" error={errors.intendedFunding?.message} required>
          <Select id="co-fund" {...register("intendedFunding")}>
            <Options items={FUNDING} />
          </Select>
        </FormField>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-ink-900">Authorised representatives</legend>
        {errors.authorisedRepresentatives?.root?.message && <p className="text-xs text-down-500">{errors.authorisedRepresentatives.root.message}</p>}
        {typeof errors.authorisedRepresentatives?.message === "string" && <p className="text-xs text-down-500">{errors.authorisedRepresentatives.message}</p>}
        {reps.fields.map((f, i) => (
          <div key={f.id} className="grid gap-3 rounded-md border border-line p-3 sm:grid-cols-[1fr,1fr,1.2fr,auto]">
            <FormField label="Name" htmlFor={`rep-name-${i}`} error={errors.authorisedRepresentatives?.[i]?.name?.message}>
              <Input id={`rep-name-${i}`} {...register(`authorisedRepresentatives.${i}.name` as const)} />
            </FormField>
            <FormField label="Role" htmlFor={`rep-role-${i}`} error={errors.authorisedRepresentatives?.[i]?.role?.message}>
              <Input id={`rep-role-${i}`} {...register(`authorisedRepresentatives.${i}.role` as const)} />
            </FormField>
            <FormField label="Email" htmlFor={`rep-email-${i}`} error={errors.authorisedRepresentatives?.[i]?.email?.message}>
              <Input id={`rep-email-${i}`} type="email" {...register(`authorisedRepresentatives.${i}.email` as const)} />
            </FormField>
            <div className="flex items-end">
              <Button type="button" variant="ghost" size="icon" onClick={() => reps.remove(i)} disabled={reps.fields.length <= 1} aria-label={`Remove representative ${i + 1}`}>
                <Trash className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={() => reps.append({ name: "", role: "", email: "" })} disabled={reps.fields.length >= 10}>
          <Plus className="h-4 w-4" aria-hidden /> Add representative
        </Button>
      </fieldset>

      <Declarations register={register} errors={errors} />
      <SubmitRow submitting={formState.isSubmitting} error={error} />
    </form>
  );
}

// ---------- SMSF ----------

export function SmsfForm({ initial, onSubmitted }: Omit<ApplicationFormProps, "type">) {
  const [error, setError] = React.useState<string | null>(null);
  const form = useForm<SmsfData>({
    resolver: zodResolver(smsfSchema),
    defaultValues: isType(initial, "SMSF")
      ? initial
      : {
          type: "SMSF",
          fundName: "",
          trusteeType: undefined,
          corporateTrusteeName: "",
          trustees: [{ name: "", email: "" }],
          memberCount: 1,
          hasInvestmentStrategyPermittingTrading: false,
          fundRegisteredWithRegulator: false,
          intendedFunding: undefined,
          isPoliticallyExposed: false,
          acceptsRiskDisclosure: unchecked,
          acknowledgesTrusteeResponsibility: unchecked,
        },
  });
  const { register, handleSubmit, formState, control } = form;
  const errors = formState.errors;
  const trustees = useFieldArray({ control, name: "trustees" });
  const trusteeType = useWatch({ control, name: "trusteeType" });
  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      onSubmitted(await submit(values, form.setError));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submission failed");
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate data-testid="application-form-smsf">
      <input type="hidden" {...register("type")} value="SMSF" />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Fund name" htmlFor="sm-name" error={errors.fundName?.message} required className="sm:col-span-2">
          <Input id="sm-name" {...register("fundName")} />
        </FormField>
        <FormField label="Trustee structure" htmlFor="sm-tt" error={errors.trusteeType?.message} required>
          <Select id="sm-tt" {...register("trusteeType")}>
            <option value="">Select…</option>
            <option value="INDIVIDUAL_TRUSTEES">Individual trustees</option>
            <option value="CORPORATE_TRUSTEE">Corporate trustee</option>
          </Select>
        </FormField>
        {trusteeType === "CORPORATE_TRUSTEE" && (
          <FormField label="Corporate trustee name" htmlFor="sm-ctn" error={errors.corporateTrusteeName?.message}>
            <Input id="sm-ctn" {...register("corporateTrusteeName")} />
          </FormField>
        )}
        <FormField label="Number of members" htmlFor="sm-members" error={errors.memberCount?.message} required>
          <Input id="sm-members" type="number" min={1} max={6} {...register("memberCount", { valueAsNumber: true })} />
        </FormField>
        <FormField label="Intended funding" htmlFor="sm-fund" error={errors.intendedFunding?.message} required>
          <Select id="sm-fund" {...register("intendedFunding")}>
            <Options items={FUNDING} />
          </Select>
        </FormField>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-ink-900">Trustees / directors of the corporate trustee</legend>
        {errors.trustees?.root?.message && <p className="text-xs text-down-500">{errors.trustees.root.message}</p>}
        {typeof errors.trustees?.message === "string" && <p className="text-xs text-down-500">{errors.trustees.message}</p>}
        {trustees.fields.map((f, i) => (
          <div key={f.id} className="grid gap-3 rounded-md border border-line p-3 sm:grid-cols-[1fr,1.2fr,auto]">
            <FormField label="Name" htmlFor={`tr-name-${i}`} error={errors.trustees?.[i]?.name?.message}>
              <Input id={`tr-name-${i}`} {...register(`trustees.${i}.name` as const)} />
            </FormField>
            <FormField label="Email" htmlFor={`tr-email-${i}`} error={errors.trustees?.[i]?.email?.message}>
              <Input id={`tr-email-${i}`} type="email" {...register(`trustees.${i}.email` as const)} />
            </FormField>
            <div className="flex items-end">
              <Button type="button" variant="ghost" size="icon" onClick={() => trustees.remove(i)} disabled={trustees.fields.length <= 1} aria-label={`Remove trustee ${i + 1}`}>
                <Trash className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={() => trustees.append({ name: "", email: "" })} disabled={trustees.fields.length >= 6}>
          <Plus className="h-4 w-4" aria-hidden /> Add trustee
        </Button>
      </fieldset>

      <fieldset className="space-y-3 rounded-md border border-line bg-surface-2/40 p-4">
        <legend className="px-1 text-sm font-medium text-ink-900">Fund compliance</legend>
        <Checkbox label="The fund's investment strategy permits trading these instruments." {...register("hasInvestmentStrategyPermittingTrading")} />
        <Checkbox label="The fund is registered with the regulator and is a complying fund." {...register("fundRegisteredWithRegulator")} />
      </fieldset>

      <Declarations
        register={register}
        errors={errors}
        extra={
          <div>
            <Checkbox label="The trustees understand and accept their responsibilities for the fund's investment decisions." {...register("acknowledgesTrusteeResponsibility")} />
            {errors.acknowledgesTrusteeResponsibility && (
              <p className="mt-1 text-xs text-down-500" role="alert">
                {errors.acknowledgesTrusteeResponsibility.message as string}
              </p>
            )}
          </div>
        }
      />
      <SubmitRow submitting={formState.isSubmitting} error={error} />
    </form>
  );
}

export function ApplicationForm({ type, initial, onSubmitted }: ApplicationFormProps) {
  if (type === "CORPORATE") return <CorporateForm initial={initial} onSubmitted={onSubmitted} />;
  if (type === "SMSF") return <SmsfForm initial={initial} onSubmitted={onSubmitted} />;
  return <IndividualForm initial={initial} onSubmitted={onSubmitted} />;
}
