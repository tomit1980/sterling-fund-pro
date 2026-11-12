"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, Badge, Button, Card, CardDescription, CardHeader, CardTitle, FormField, Input, Skeleton, useToast } from "@/components/ui";
import { profileSchema, type ProfileInput } from "@/lib/validation/account";
import { apiFetch, ClientApiError } from "../api-client";

export interface ProfileData {
  id: string;
  email: string;
  name: string;
  role: string;
  emailVerified: boolean;
  mfaEnabled: boolean;
  createdAt: string;
  phone: string;
  country: string;
  addressLine: string;
  city: string;
  postcode: string;
  updatedAt: string | null;
}

/** GET/PUT /api/account/profile (Agent C). */
export function ProfileForm({ onLoaded }: { onLoaded?: (p: ProfileData) => void }) {
  const { toast } = useToast();
  const [profile, setProfile] = React.useState<ProfileData | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "", phone: "", country: "", addressLine: "", city: "", postcode: "" },
  });
  const { register, handleSubmit, reset, setError, formState } = form;

  React.useEffect(() => {
    let cancelled = false;
    apiFetch<{ profile: ProfileData }>("/api/account/profile")
      .then(({ profile: p }) => {
        if (cancelled) return;
        setProfile(p);
        onLoaded?.(p);
        reset({ name: p.name, phone: p.phone, country: p.country, addressLine: p.addressLine, city: p.city, postcode: p.postcode });
      })
      .catch((e: unknown) => !cancelled && setLoadError(e instanceof Error ? e.message : "Could not load your profile"));
    return () => {
      cancelled = true;
    };
  }, [reset, onLoaded]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      const { profile: p } = await apiFetch<{ profile: ProfileData }>("/api/account/profile", { method: "PUT", json: values });
      setProfile(p);
      reset({ name: p.name, phone: p.phone, country: p.country, addressLine: p.addressLine, city: p.city, postcode: p.postcode });
      toast({ title: "Profile saved", tone: "success" });
    } catch (e) {
      if (e instanceof ClientApiError && e.fieldErrors) {
        for (const [k, msgs] of Object.entries(e.fieldErrors)) setError(k as keyof ProfileInput, { message: msgs[0] });
      }
      toast({ title: "Could not save profile", description: e instanceof Error ? e.message : undefined, tone: "error" });
    }
  });

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Contact details used for account correspondence. Identity documents are never collected here.</CardDescription>
        </div>
        {profile && (
          <div className="flex flex-wrap gap-2">
            <Badge tone={profile.emailVerified ? "up" : "warn"}>{profile.emailVerified ? "Email verified" : "Email unverified"}</Badge>
            <Badge>{profile.role}</Badge>
          </div>
        )}
      </CardHeader>
      {loadError && (
        <Alert tone="error" className="mb-4">
          {loadError}
        </Alert>
      )}
      {!profile && !loadError ? (
        <div className="space-y-3">
          <Skeleton className="h-11" />
          <Skeleton className="h-11" />
          <Skeleton className="h-11" />
        </div>
      ) : (
        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2" noValidate>
          <FormField label="Full name" htmlFor="pf-name" error={formState.errors.name?.message} required className="sm:col-span-2">
            <Input id="pf-name" autoComplete="name" {...register("name")} aria-invalid={Boolean(formState.errors.name)} />
          </FormField>
          <FormField label="Email" htmlFor="pf-email" hint="Contact support to change your login email." className="sm:col-span-2">
            <Input id="pf-email" value={profile?.email ?? ""} readOnly disabled />
          </FormField>
          <FormField label="Phone" htmlFor="pf-phone" error={formState.errors.phone?.message}>
            <Input id="pf-phone" type="tel" autoComplete="tel" {...register("phone")} />
          </FormField>
          <FormField label="Country" htmlFor="pf-country" error={formState.errors.country?.message}>
            <Input id="pf-country" autoComplete="country-name" {...register("country")} />
          </FormField>
          <FormField label="Address" htmlFor="pf-address" error={formState.errors.addressLine?.message} className="sm:col-span-2">
            <Input id="pf-address" autoComplete="street-address" {...register("addressLine")} />
          </FormField>
          <FormField label="City" htmlFor="pf-city" error={formState.errors.city?.message}>
            <Input id="pf-city" autoComplete="address-level2" {...register("city")} />
          </FormField>
          <FormField label="Postcode" htmlFor="pf-postcode" error={formState.errors.postcode?.message}>
            <Input id="pf-postcode" autoComplete="postal-code" {...register("postcode")} />
          </FormField>
          <div className="flex items-center justify-end gap-3 sm:col-span-2">
            {profile?.updatedAt && <span className="text-xs text-ink-500">Last updated {new Date(profile.updatedAt).toLocaleString()}</span>}
            <Button type="submit" loading={formState.isSubmitting} disabled={!formState.isDirty}>
              Save changes
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
