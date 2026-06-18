'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { AnimatedSection } from './animated-section';
import { Eyebrow } from './eyebrow';

const faqs = [
  {
    question: 'Do I need to connect a bank account?',
    answer:
      'No. SubTrack is built around manual entry, so you decide which subscriptions and details belong in the app.',
  },
  {
    question: 'Can I export my data?',
    answer:
      'Yes. You can export subscription data when you need a spreadsheet view, a backup, or a copy outside SubTrack.',
  },
  {
    question: 'Can I organize personal and work subscriptions separately?',
    answer:
      'Yes. Collections let you separate different groups of subscriptions, and categories help you organize the services inside each collection.',
  },
  {
    question: 'Does it work on mobile?',
    answer:
      'The web app is responsive and works in mobile browsers. There is not a separate native mobile app right now.',
  },
  {
    question: 'Is SubTrack open source?',
    answer:
      'Yes. The source code is public on GitHub, so you can inspect the implementation and follow the project as it evolves.',
  },
  {
    question: 'What happens after I sign up?',
    answer:
      'You can open the dashboard, create collections, add subscriptions, review cost metrics, and export your data when needed.',
  },
];

export function FAQSection() {
  return (
    <section className="bg-white py-16 md:py-24" id="faq">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="mx-auto max-w-2xl text-center">
          <Eyebrow className="justify-center">FAQ</Eyebrow>
          <h2 className="mt-4 text-balance font-bold text-3xl text-gray-950 tracking-tight sm:text-4xl">
            Questions worth answering
          </h2>
          <p className="mt-4 text-pretty text-gray-600 text-lg leading-8">
            Short answers about the way SubTrack handles access, data, and
            everyday use.
          </p>
        </AnimatedSection>

        <AnimatedSection className="mx-auto mt-12 max-w-3xl" delay={0.08}>
          <Accordion className="space-y-3" collapsible type="single">
            {faqs.map((faq, index) => (
              <AccordionItem
                className="rounded-xl border border-gray-200/80 bg-white px-5 shadow-brand-xs transition-colors duration-200 hover:border-brand-200 data-[state=open]:border-brand-200 data-[state=open]:shadow-brand-sm"
                key={faq.question}
                value={`item-${index}`}
              >
                <AccordionTrigger className="py-4 text-left font-medium text-gray-950 hover:no-underline data-[state=open]:text-brand-700">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 leading-7 [&>div]:pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </AnimatedSection>
      </div>
    </section>
  );
}
