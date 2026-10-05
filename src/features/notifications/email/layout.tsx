import type { CSSProperties, ReactNode } from 'react';
import {
  Body,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from 'react-email';

import {
  BRAND_COLOR,
  formatUsd,
  pluralize,
} from '@/features/notifications/format';

// Email clients ignore stylesheets unevenly, so every style is inline. The
// layout is a single fluid column capped at 600px, which holds up from about
// 320px wide.

export const colors = {
  brand: BRAND_COLOR,
  text: '#0a0a0a',
  muted: '#737373',
  border: '#e5e5e5',
  surface: '#ffffff',
  canvas: '#f5f5f5',
  tagBackground: '#f0f9ff',
  tagText: '#00598a',
};

const fontFamily =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Helvetica, Arial, sans-serif";

const styles = {
  body: {
    backgroundColor: colors.canvas,
    fontFamily,
    margin: 0,
    padding: '24px 12px',
  },
  container: {
    backgroundColor: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: '10px',
    maxWidth: '600px',
    width: '100%',
    padding: '28px 24px',
  },
  wordmark: {
    color: colors.brand,
    fontSize: '15px',
    fontWeight: 700,
    letterSpacing: '-0.01em',
    margin: '0 0 20px',
  },
  heading: {
    color: colors.text,
    fontSize: '22px',
    fontWeight: 700,
    lineHeight: '28px',
    margin: '0 0 8px',
  },
  lead: {
    color: colors.text,
    fontSize: '15px',
    lineHeight: '22px',
    margin: '0 0 4px',
  },
  note: {
    color: colors.muted,
    fontSize: '13px',
    lineHeight: '20px',
    margin: '16px 0 0',
  },
  footer: {
    color: colors.muted,
    fontSize: '12px',
    lineHeight: '18px',
    margin: '0 0 6px',
  },
  footerLink: { color: colors.muted, textDecoration: 'underline' },
  hr: { borderColor: colors.border, margin: '24px 0' },
} satisfies Record<string, CSSProperties>;

export function EmailLayout({
  previewText,
  heading,
  children,
  footer,
}: {
  previewText: string;
  heading: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <Html lang="en">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
      </Head>
      <Preview>{previewText}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Text style={styles.wordmark}>EverySub</Text>
          <Heading as="h1" style={styles.heading}>
            {heading}
          </Heading>
          {children}
          <Hr style={styles.hr} />
          {footer}
        </Container>
      </Body>
    </Html>
  );
}

export function Lead({ children }: { children: ReactNode }) {
  return <Text style={styles.lead}>{children}</Text>;
}

export function Note({ children }: { children: ReactNode }) {
  return <Text style={styles.note}>{children}</Text>;
}

export function TestBanner() {
  return (
    <Section
      style={{
        backgroundColor: colors.tagBackground,
        borderRadius: '8px',
        margin: '12px 0 4px',
        padding: '10px 14px',
      }}
    >
      <Text
        style={{
          color: colors.tagText,
          fontSize: '13px',
          fontWeight: 600,
          lineHeight: '20px',
          margin: 0,
        }}
      >
        This is a test with sample data. No real subscriptions are included.
      </Text>
    </Section>
  );
}

export function FooterText({ children }: { children: ReactNode }) {
  return <Text style={styles.footer}>{children}</Text>;
}

export function ManageLink({ href }: { href: string }) {
  return (
    <FooterText>
      Change which collections send notifications in{' '}
      <Link href={href} style={styles.footerLink}>
        EverySub notification settings
      </Link>
      .
    </FooterText>
  );
}

export function SectionHeading({
  title,
  summary,
}: {
  title: string;
  summary: string;
}) {
  return (
    <Section style={{ margin: '28px 0 4px' }}>
      <Heading
        as="h2"
        style={{
          color: colors.text,
          fontSize: '17px',
          fontWeight: 700,
          lineHeight: '24px',
          margin: 0,
        }}
      >
        {title}
      </Heading>
      <Text
        style={{
          color: colors.muted,
          fontSize: '14px',
          lineHeight: '20px',
          margin: '2px 0 0',
        }}
      >
        {summary}
      </Text>
    </Section>
  );
}

/** A collection's name, its count and subtotal, and its rows. */
export function CollectionBlock({
  name,
  itemCount,
  subtotalCents,
  noun,
  children,
}: {
  name: string;
  itemCount: number;
  subtotalCents: number;
  noun: string;
  children: ReactNode;
}) {
  return (
    <Section style={{ margin: '16px 0 0' }}>
      <Row style={{ borderBottom: `1px solid ${colors.border}` }}>
        <Column style={{ padding: '0 0 6px' }}>
          <Text
            style={{
              color: colors.text,
              fontSize: '14px',
              fontWeight: 700,
              lineHeight: '20px',
              margin: 0,
            }}
          >
            {name}
          </Text>
        </Column>
        <Column
          align="right"
          style={{ padding: '0 0 6px', whiteSpace: 'nowrap' }}
        >
          <Text
            style={{
              color: colors.muted,
              fontSize: '13px',
              lineHeight: '20px',
              margin: 0,
            }}
          >
            {pluralize(itemCount, noun)} · {formatUsd(subtotalCents)}
          </Text>
        </Column>
      </Row>
      {children}
    </Section>
  );
}

/** One occurrence: date, name with an optional tag, and amount. */
export function ItemRow({
  date,
  name,
  amountCents,
  tag,
}: {
  date: string;
  name: string;
  amountCents: number;
  tag?: string;
}) {
  return (
    <Row style={{ borderBottom: `1px solid ${colors.border}` }}>
      <Column
        style={{
          padding: '9px 10px 9px 0',
          verticalAlign: 'top',
          whiteSpace: 'nowrap',
          width: '76px',
        }}
      >
        <Text
          style={{
            color: colors.muted,
            fontSize: '13px',
            lineHeight: '20px',
            margin: 0,
          }}
        >
          {date}
        </Text>
      </Column>
      <Column
        style={{
          padding: '9px 10px 9px 0',
          verticalAlign: 'top',
          wordBreak: 'break-word',
        }}
      >
        <Text
          style={{
            color: colors.text,
            fontSize: '14px',
            lineHeight: '20px',
            margin: 0,
          }}
        >
          {name}
        </Text>
        {tag ? (
          <Text
            style={{
              color: colors.muted,
              fontSize: '12px',
              lineHeight: '16px',
              margin: '2px 0 0',
            }}
          >
            {tag}
          </Text>
        ) : null}
      </Column>
      <Column
        align="right"
        style={{ padding: '9px 0', verticalAlign: 'top', whiteSpace: 'nowrap' }}
      >
        <Text
          style={{
            color: colors.text,
            fontSize: '14px',
            fontWeight: 600,
            lineHeight: '20px',
            margin: 0,
          }}
        >
          {formatUsd(amountCents)}
        </Text>
      </Column>
    </Row>
  );
}

export function EmptySection({ children }: { children: ReactNode }) {
  return (
    <Text
      style={{
        border: `1px dashed ${colors.border}`,
        borderRadius: '8px',
        color: colors.muted,
        fontSize: '14px',
        lineHeight: '20px',
        margin: '12px 0 0',
        padding: '12px 14px',
      }}
    >
      {children}
    </Text>
  );
}
