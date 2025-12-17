import {
  BenefitsSection,
  CTASection,
  FAQSection,
  FeaturesSection,
  Footer,
  Header,
  HeroSection,
  PricingSection,
  ProblemSection,
} from '@/components/landing';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Subtle Grid Backdrop */}
      <div className="-z-10 fixed inset-0 h-full w-full bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" />

      <Header />

      <main>
        <HeroSection />
        <ProblemSection />
        <FeaturesSection />
        <BenefitsSection />
        <PricingSection />
        <FAQSection />
        <CTASection />
      </main>

      <Footer />
    </div>
  );
}
