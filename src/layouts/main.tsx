import React from "react"
import Link from "next/link"
import Head from "next/head"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { signOut, useSession } from "next-auth/react"

import { 
  IconDashboard,
  IconEdit,
  IconPlus,
  IconSettings
} from "@tabler/icons-react"

import { useModalState } from "@/lib/hooks"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import NewSubscriptionModal from "@/components/subscriptions/NewSubscriptionModal"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

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
        <section className="ml-auto mr-auto max-w-[1200px]">
          <div className="flex h-16 items-center px-4">
            <Link href={"/"} className="cursor-pointer">
              <Image alt="SubTrack" width={265} height={30} src={"/subtrack_full.jpg"} />
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
              <Button className="gap-2 " onClick={() => {
                newModalState.setState("open");
              }}>
                <IconPlus />
                Add Subscription
              </Button>
            </div>
            {
              session &&
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar>
                      <AvatarImage alt={session.user.name!} src={session.user.image || "https://img.icons8.com/cotton/64/gender-neutral-user--v1.png"} />
                      <AvatarFallback>||</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" sideOffset={10} forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{session.user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {session.user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <Link href={'/settings/account'}>
                    <DropdownMenuItem>
                      Settings
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-700" onClick={() => signOut({ callbackUrl: '/', redirect: true })}>
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            }
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
