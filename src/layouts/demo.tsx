import React from "react"
import Link from "next/link"
import Head from "next/head"
import Image from "next/image"

import { 
  IconEdit,
  IconPlus,
} from "@tabler/icons-react"

import { useModalState } from "@/lib/hooks"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import NewSubscriptionModal from "@/components/subscriptions/NewSubscriptionModal"

type DemoLayoutProps = {
  children: React.ReactNode
  title?: string
}

export default function DemoLayout({ children, title }: DemoLayoutProps) {
  const newModalState = useModalState();

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      <div className="border-b">
        <section className="ml-auto mr-auto max-w-[1200px]">
          <div className="flex h-16 items-center px-4">
            <Link href={"/"} className="cursor-pointer">
              <Image alt="SubTrack" width={265} height={30} src={"/subtrack_full.jpg"} />
            </Link>
            <div className="ml-auto">
              <Button className="gap-2" onClick={() => {
                newModalState.setState("open");
              }}>
                <IconPlus />
                Add Subscription
              </Button>
            </div>
          </div>
        </section>
      </div>
      <main className="ml-auto mr-auto max-w-[1200px] pb-8 px-6">
        {children}
        <Toaster />
        <NewSubscriptionModal demo state={newModalState} />
      </main>
    </>
  )
}
