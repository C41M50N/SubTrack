import React from "react"
import Link from "next/link"
import Head from "next/head"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

import { 
  IconDashboard,
  IconEdit,
  IconPlus,
  IconSettings
} from "@tabler/icons-react"

import { useModalState } from "@/lib/hooks"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { Avatar, AvatarImage } from "@/components/ui/avatar"
import NewSubscriptionModal from "@/components/subscriptions/NewSubscriptionModal"

type MainLayoutProps = {
  children: React.ReactNode
  title?: string
}

export default function MainLayout({ children, title }: MainLayoutProps) {
  const { data: session } = useSession();
  const router = useRouter();

  const newModalState = useModalState();
  
  React.useEffect(() => {
    return () => {
      if (session === null) {
        router.replace('/')
      }
    }
  }, [session])

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      <div className="border-b">
        <section className="ml-auto mr-auto max-w-[1600px]">
          <div className="flex h-16 items-center px-4">
            <Link href={"/"} className="flex flex-row gap-1 items-center cursor-pointer">
              <IconEdit size={28} />
              <h1 className="text-2xl">SubTrack</h1>
            </Link>
            <nav className="flex items-center space-x-4 mx-6 pl-8 lg:space-x-6">
              <Link href={"/dashboard"} className="text-md font-medium text-muted-foreground transition-colors rounded-md p-2 px-2 flex flex-row gap-1 hover:text-primary">
                <IconDashboard />
                Dashboard
              </Link>
              <Link href={"/settings/categories"} className="text-md font-medium text-muted-foreground transition-colors rounded-md p-2 px-2 flex flex-row gap-1 hover:text-primary">
                <IconSettings />
                Settings
              </Link>
            </nav>
            <div className="ml-auto mr-14">
              <Button className="gap-2" onClick={() => {
                newModalState.setState("open");
              }}>
                <IconPlus />
                Add Subscription
              </Button>
            </div>
            <Link href={"/settings/account"} className="flex items-center space-x-4 p-2 px-3 border border-gray-500 border-opacity-30 rounded-md hover:bg-muted hover:cursor-pointer">
              <span className="text-lg font-normal text-black/80">{session?.user.name}</span>
              <Avatar>
                {/* <AvatarImage src="https://github.com/shadcn.png" /> */}
                {/* <AvatarImage src={"https://img.icons8.com/cotton/64/gender-neutral-user--v1.png"} /> */}
                <AvatarImage src={session?.user.image || "https://img.icons8.com/cotton/64/gender-neutral-user--v1.png"} />
              </Avatar>
            </Link>
          </div>
        </section>
      </div>
      <main className="ml-auto mr-auto max-w-[1200px] pb-8 px-6">
        {children}
        <Toaster />
        <NewSubscriptionModal state={newModalState} />
      </main>
    </>
  )
}
