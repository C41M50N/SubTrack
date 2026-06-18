import { AccessSection } from '@/features/landing/components/access-section';
import { BenefitsSection } from '@/features/landing/components/benefits-section';
import { CTASection } from '@/features/landing/components/cta-section';
import { FAQSection } from '@/features/landing/components/faq-section';
import { FeaturesSection } from '@/features/landing/components/features-section';
import { Footer } from '@/features/landing/components/footer';
import { Header } from '@/features/landing/components/header';
import { HeroSection } from '@/features/landing/components/hero-section';
import { ProblemSection } from '@/features/landing/components/problem-section';

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-white">
      <div
        aria-hidden="true"
        className="-z-10 pointer-events-none fixed inset-0 h-full w-full bg-[linear-gradient(to_right,#5162820f_1px,transparent_1px),linear-gradient(to_bottom,#5162820f_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_75%_55%_at_50%_0%,#000,transparent)]"
      />

      <Header />

      <main>
        <HeroSection />
        <ProblemSection />
        <FeaturesSection />
        <BenefitsSection />
        <AccessSection />
        <FAQSection />
        <CTASection />
      </main>

      <Footer />
    </div>
  );
}
