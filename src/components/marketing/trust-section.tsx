import { Eye, Headset, ShieldCheck } from "lucide-react";
import { Container, Section, SectionHeading } from "@/components/ui/layout";
import { FeatureGrid, type Feature } from "./feature-grid";

/** Every statement here describes this product as built. Nothing about licences, awards or clients. */
const TRUST: Feature[] = [
  {
    icon: ShieldCheck,
    title: "Security by default",
    description:
      "Passwords are hashed with bcrypt, sessions are opaque server-side tokens, optional authenticator-app MFA protects your login, and every account action is written to an audit log.",
  },
  {
    icon: Eye,
    title: "Transparency over hype",
    description:
      "This is a demo environment until regulated integrations are connected. Sample prices and balances carry a visible DEMO DATA marker, and no real funds, orders or custody are involved.",
  },
  {
    icon: Headset,
    title: "Support that says when it is offline",
    description:
      "Live chat only shows an agent as available when one is actually online. Outside office hours you leave a message and we reply by email.",
  },
];

export function TrustSection() {
  return (
    <Section id="why-us" aria-labelledby="why-us-heading">
      <Container>
        <SectionHeading
          eyebrow="Why Sterling Fund Pro"
          title={<span id="why-us-heading">Built to be checked, not just believed</span>}
          description="We describe what the platform does today. Features that depend on licences or third-party integrations are labelled as such."
        />
        <FeatureGrid features={TRUST} />
      </Container>
    </Section>
  );
}
