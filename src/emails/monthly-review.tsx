import type { Subscription } from '@prisma/client';
import {
  Body,
  Column,
  Container,
  Head,
  Html,
  Img,
  Preview,
  Row,
  Tailwind,
} from '@react-email/components';
import dayjs from '@/lib/dayjs';
import { toMoneyString } from '@/utils';
import { Text } from './primitives/text';

const ExampleRenewingSoon = [
  {
    id: 'cm5cxngtd00074qpots1rfna6',
    name: 'Claude Pro',
    amount: 2000,
    frequency: 'monthly',
    category: 'productivity',
    next_invoice: dayjs('2025-02-13T05:00:00.000Z').toDate(),
    last_invoice: dayjs('2025-01-13T05:00:00.000Z').toDate(),
    icon_ref: 'default',
    send_alert: true,
    collection_id: 'cm5cxn3he0001127rbsz8xkhq',
    user_id: '1Ax7J3cTdWr3a8GtcZPNtQHvDgkXqlLl',
  },
  {
    id: 'cm5cxngtd00054qpohwiik7ni',
    name: 'Vercel',
    amount: 2000,
    frequency: 'monthly',
    category: 'productivity',
    next_invoice: dayjs('2025-02-09T04:00:00.000Z').toDate(),
    last_invoice: dayjs('2025-01-09T04:00:00.000Z').toDate(),
    icon_ref: 'default',
    send_alert: true,
    collection_id: 'cm5cxn3he0001127rbsz8xkhq',
    user_id: '1Ax7J3cTdWr3a8GtcZPNtQHvDgkXqlLl',
  },
  {
    id: 'cm5cxngtd000g4qpos1o0dw3s',
    name: 'Uploadthing 100GB',
    amount: 1000,
    frequency: 'monthly',
    category: 'dev:jumpdrive',
    next_invoice: dayjs('2025-01-18T05:40:38.043Z').toDate(),
    last_invoice: dayjs('2024-12-18T05:40:38.043Z').toDate(),
    icon_ref: 'default',
    send_alert: true,
    collection_id: 'cm5cxn3he0001127rbsz8xkhq',
    user_id: '1Ax7J3cTdWr3a8GtcZPNtQHvDgkXqlLl',
  },
];

const ExampleRenewedRecently = [
  {
    id: 'cm5cxngtd00084qpoiu4c1658',
    name: 'Spotify + Hulu',
    amount: 1199,
    frequency: 'monthly',
    category: 'entertainment',
    next_invoice: dayjs('2025-01-16T04:00:00.000Z').toDate(),
    last_invoice: dayjs('2024-12-16T04:00:00.000Z').toDate(),
    icon_ref: 'spotify',
    send_alert: true,
    collection_id: 'cm5cxn3he0001127rbsz8xkhq',
    user_id: '1Ax7J3cTdWr3a8GtcZPNtQHvDgkXqlLl',
  },
  {
    id: 'cm5cxngtd000g4qpos1o0dw3s',
    name: 'Uploadthing 100GB',
    amount: 1000,
    frequency: 'monthly',
    category: 'dev:jumpdrive',
    next_invoice: dayjs('2025-01-18T05:40:38.043Z').toDate(),
    last_invoice: dayjs('2024-12-18T05:40:38.043Z').toDate(),
    icon_ref: 'default',
    send_alert: true,
    collection_id: 'cm5cxn3he0001127rbsz8xkhq',
    user_id: '1Ax7J3cTdWr3a8GtcZPNtQHvDgkXqlLl',
  },
  {
    id: 'cm5cxngtd000h4qpoapl6v6v5',
    name: 'Netflix',
    amount: 1549,
    frequency: 'monthly',
    category: 'entertainment',
    next_invoice: dayjs('2025-01-21T05:00:00.000Z').toDate(),
    last_invoice: dayjs('null').toDate(),
    icon_ref: 'netflix',
    send_alert: true,
    collection_id: 'cm5cxn3he0001127rbsz8xkhq',
    user_id: '1Ax7J3cTdWr3a8GtcZPNtQHvDgkXqlLl',
  },
  {
    id: 'cm5cxngtd00054qpohwiik7ni',
    name: 'Vercel',
    amount: 2000,
    frequency: 'monthly',
    category: 'productivity',
    next_invoice: dayjs('2025-02-09T04:00:00.000Z').toDate(),
    last_invoice: dayjs('2025-01-09T04:00:00.000Z').toDate(),
    icon_ref: 'default',
    send_alert: true,
    collection_id: 'cm5cxn3he0001127rbsz8xkhq',
    user_id: '1Ax7J3cTdWr3a8GtcZPNtQHvDgkXqlLl',
  },
  {
    id: 'cm5cxngtd00074qpots1rfna6',
    name: 'Claude Pro',
    amount: 2000,
    frequency: 'monthly',
    category: 'productivity',
    next_invoice: dayjs('2025-02-13T05:00:00.000Z').toDate(),
    last_invoice: dayjs('2025-01-13T05:00:00.000Z').toDate(),
    icon_ref: 'default',
    send_alert: true,
    collection_id: 'cm5cxn3he0001127rbsz8xkhq',
    user_id: '1Ax7J3cTdWr3a8GtcZPNtQHvDgkXqlLl',
  },
];

export type MonthlyReviewEmailProps = {
  renewingSoon: Subscription[];
  renewedRecently: Subscription[];
};

export function MonthlyReviewEmail({
  renewingSoon = ExampleRenewingSoon,
  renewedRecently = ExampleRenewedRecently,
}: Readonly<MonthlyReviewEmailProps>) {
  // sort asc
  const renewingSoonSubs = renewingSoon.sort(
    (a, b) => a.next_invoice.getTime() - b.next_invoice.getTime()
  );

  // sort desc
  const renewedRecentlySubs = renewedRecently.sort(
    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    (a, b) => b.last_invoice!.getTime() - a.last_invoice!.getTime()
  );

  return (
    <Html>
      <Head />
      <Preview>Monthly Subscriptions Review</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white font-sans">
          <Container className="mx-auto px-4 pt-5">
            <Img
              alt="SubTrack"
              className="mb-3"
              height={30}
              src="https://subtrack.cbuff.dev/subtrack_full.jpg"
              width={135}
            />
            <Text className="font-bold text-xl">
              {dayjs().format('MMMM')} Subscriptions Review
            </Text>

            {renewingSoonSubs.length > 0 && (
              <Row className="mt-3">
                <Column>
                  <Text className="font-bold text-lg">Renewing soon</Text>
                  <Text className="font-medium text-xs">
                    The following subscriptions are renewing within the next 32
                    days.
                  </Text>
                  <ul className="mt-2 mb-2 pl-6">
                    {renewingSoonSubs.map((sub) => (
                      <li className="py-0.5" key={sub.id}>
                        <Text className="text-base">
                          {sub.name} renewing on{' '}
                          {dayjs(sub.next_invoice).format('MMM D')} (
                          {toMoneyString(sub.amount)} {sub.frequency})
                        </Text>
                      </li>
                    ))}
                  </ul>
                </Column>
              </Row>
            )}

            {renewedRecentlySubs.length > 0 && (
              <Row className="mt-1">
                <Column>
                  <Text className="font-bold text-lg">Renewed recently</Text>
                  <Text className="font-medium text-xs">
                    The following subscriptions are renewed recently.
                  </Text>
                  <ul className="mt-2 mb-2 pl-6">
                    {renewedRecentlySubs.map((sub) => {
                      if (!sub.last_invoice) {
                        throw new Error(
                          'invalid recently renewed subscription'
                        );
                      }
                      return (
                        <li className="py-0.5" key={sub.id}>
                          <Text className="text-base">
                            {sub.name} renewed on{' '}
                            {dayjs(sub.last_invoice).format('MMM D')} (
                            {toMoneyString(sub.amount)} {sub.frequency})
                          </Text>
                        </li>
                      );
                    })}
                  </ul>
                </Column>
              </Row>
            )}
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default MonthlyReviewEmail;
