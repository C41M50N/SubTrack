import type {
  GetServerSidePropsContext,
  InferGetServerSidePropsType,
} from "next"
import Image from "next/image";
import { getProviders, signIn } from "next-auth/react"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/server/auth"
import { IconEdit } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function SignInPage({
  provider,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <div className="h-screen max-w-md container mx-auto flex flex-col items-center pt-52 gap-3">
      <div className="flex flex-row gap-1 items-center">
        <IconEdit size={64} />
        <h1 className="text-5xl">SubTrack</h1>
      </div>

      <Separator />

      <Button className="flex flex-row gap-4" variant={"secondary"} size="lg" onClick={() => signIn(provider.id)}>
        <Image alt="Google Icon" src="/google.svg" width={1} height={1} className="w-6 h-6" />
        <span className="font-semibold text-lg">Sign In with Google</span>
      </Button>
    </div>
  )
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions)

  // If the user is already logged in, redirect.
  // Note: Make sure not to redirect to the same page
  // To avoid an infinite loop!
  if (session) {
    return { redirect: { destination: "/dashboard" } }
  }

  const providers = await getProviders()

  return {
    props: { provider: providers!.google },
  }
}
