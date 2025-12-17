'use client';

import { AnimatedSection } from './animated-section';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    question: 'Is my data secure?',
    answer:
      'Yes. Your data is encrypted at rest and in transit. We use industry-standard security practices to protect your information, and we never sell or share your data with third parties.',
  },
  {
    question: 'Do you need access to my bank account?',
    answer:
      "No. Unlike other financial tracking tools, SubTrack doesn't require you to link your bank accounts. You manually add your subscriptions, giving you full control over what information you share.",
  },
  {
    question: 'Can I export my data?',
    answer:
      'Absolutely. You can export all your subscription data to CSV format at any time. Your data belongs to you, and you can take it wherever you need.',
  },
  {
    question: 'Is there a mobile app?',
    answer:
      'Not yet, but SubTrack is fully responsive and works great on mobile browsers. A dedicated mobile app is on our roadmap for the future.',
  },
  {
    question: 'What happens after I pay?',
    answer:
      "You get immediate access to all features. The $15 payment is a one-time fee—there are no recurring charges. You'll also receive all future updates at no additional cost.",
  },
  {
    question: 'Can I get a refund?',
    answer:
      "Yes. If you're not satisfied within 30 days of purchase, contact us and we'll provide a full refund, no questions asked.",
  },
];

export function FAQSection() {
  return (
    <section className="bg-gray-50 py-20 md:py-28" id="faq">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="mx-auto max-w-2xl text-center">
          <h2 className="font-bold text-3xl text-gray-900 tracking-tight sm:text-4xl">
            Frequently asked questions
          </h2>
          <p className="mt-4 text-gray-600 text-lg">
            Got questions? We\'ve got answers.
          </p>
        </AnimatedSection>

        <AnimatedSection className="mt-12 md:mt-16" delay={0.1}>
          <div className="mx-auto max-w-3xl">
            <Accordion className="space-y-4" collapsible type="single">
              {faqs.map((faq, index) => (
                <AccordionItem
                  className="overflow-hidden rounded-lg border border-gray-200 bg-white px-6"
                  key={index}
                  value={`item-${index}`}
                >
                  <AccordionTrigger className="py-4 text-left font-medium text-gray-900 hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 text-gray-600">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
