import React from "react"
import {
  Head,
  Html,
  Button,
  Preview,
  Body,
  Container,
  Heading,
  Text,
  Tailwind
} from "@react-email/components"
import { Subscription } from "@prisma/client";
import dayjs from "@/lib/dayjs";

type MonthlyReviewEmailProps = {
  user_name: string;
  renewing_soon: Subscription[] | undefined;
  renewed_recently: Subscription[] | undefined;
}

export function MonthlyReviewEmail({
  user_name,
  renewing_soon,
  renewed_recently
}: Readonly<MonthlyReviewEmailProps>) {
  return (
    <Html>
      <Head />
      <Preview>Monthly Subscriptions Review</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] w-[465px]">
            <Heading className="">Hey {user_name}!</Heading>
            {renewing_soon && (
              <div className="flex flex-col gap-2">
                <Text className="text-xl">Subscriptions that are renewing soon:</Text>
                <ul>
                  {renewing_soon.map((sub) => (
                    <li key={sub.id}>
                      <Text className="text-lg my-2">{sub.name} renewing on {dayjs(sub.next_invoice).format('MMM D')} ({sub.amount}/{sub.frequency})</Text>
                    </li>
                  ))}
                </ul>
                <div className="h-6" />
              </div>
            )}

            {renewed_recently && (
              <div className="flex flex-col gap-2">
                <Text className="text-xl">Subscriptions that have renewed recently:</Text>
                <ul>
                  {renewed_recently.map((sub) => (
                    <li key={sub.id}>
                      <Text className="text-lg my-2">{sub.name} renewed on {dayjs(sub.last_invoice!).format('MMM D')} ({sub.amount}/{sub.frequency})</Text>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
