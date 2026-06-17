import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { HeroUpload } from "@/components/landing/HeroUpload";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Problems } from "@/components/landing/Problems";
import { Benefits } from "@/components/landing/Benefits";
import { Pricing } from "@/components/landing/Pricing";
import { CTA } from "@/components/landing/CTA";
import { SITE_CONFIG } from "@/lib/config";

export default function LandingPage() {
  return (
    <>
      <PublicNavbar />
      <main>
        <HeroUpload />
        <HowItWorks />
        <Problems />
        <Benefits />
        <Pricing />
        <CTA />
      </main>
      <Footer />
      <WhatsAppButton
        number={SITE_CONFIG.whatsappNumber}
        defaultMessage={SITE_CONFIG.whatsappDefaultMessage}
      />
    </>
  );
}
