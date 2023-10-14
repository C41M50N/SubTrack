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

type RenewalAlertProps = {
  user_name: string
  subscriptions: {
    id: string,
    title: string,
    renewal_date: string
  }[]
}

const default_subs = [
  {
    id: "1",
    title: "Spotify Premium",
    renewal_date: "Monday, Jun 30"
  },
  {
    id: "2",
    title: "Proton Pro",
    renewal_date: "Thursday, Sep 14"
  },
  {
    id: "3",
    title: "Google One",
    renewal_date: "Tuesday, Jan 3"
  },
  {
    id: "4",
    title: "Framer Motion Pro",
    renewal_date: "Saturday, May 10"
  }
]

export default function RenewalAlertEmail({
  user_name = "Charles Buffington",
  subscriptions = default_subs
}: Readonly<RenewalAlertProps>) {
  return (
    <Html>
      <Head />
      <Preview>Your subscriptions are renewing soon</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] w-[465px]">
            <Heading className="">Hey {user_name}!</Heading>
            <Text className="text-xl">You have some subscriptions renewing soon:</Text>
            <ul>
              {subscriptions && subscriptions.map((sub) => (
                <li key={sub.id}>
                  <Text className="text-lg my-2">{sub.title} - {sub.renewal_date}</Text>
                </li>
              ))}
            </ul>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
