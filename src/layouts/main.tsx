import React from "react"
import Link from "next/link"

import { 
  IconDashboard,
  IconEdit,
  IconPlus,
  IconSettings
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage } from "@/components/ui/avatar"

type MainLayoutProps = {
  children: React.ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <>
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
              <Link href={"/settings/account"} className="text-md font-medium text-muted-foreground transition-colors rounded-md p-2 px-2 flex flex-row gap-1 hover:text-primary">
                <IconSettings />
                Settings
              </Link>
            </nav>
            <div className="ml-auto mr-14">
              <Button className="gap-2">
                <IconPlus />
                Add Subscription
              </Button>
            </div>
            <Link href={"/settings/account"} className="flex items-center space-x-4 p-2 px-3 hover:bg-muted rounded-lg hover:cursor-pointer">
              <span className="text-lg font-normal text-muted-foreground">Chris Paul</span>
              <Avatar>
                {/* <AvatarImage src="https://github.com/shadcn.png" /> */}
                <AvatarImage src={"https://img.icons8.com/cotton/64/gender-neutral-user--v1.png"} />
              </Avatar>
            </Link>
          </div>
        </section>
      </div>
      <main className="ml-auto mr-auto max-w-[1200px]">
        {children}
      </main>
    </>
  )
}
