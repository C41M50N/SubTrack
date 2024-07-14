import type {
  GetServerSidePropsContext,
  InferGetServerSidePropsType,
} from "next";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { getServerSession } from "next-auth/next";
import { getProviders, signIn } from "next-auth/react";
import { IconExternalLink } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { authOptions } from "@/server/auth";

export default function SignInPage({
  provider,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <>
      <Head>
        <title>SubTrack | A Subscriptions Tracking Dashboard</title>
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png"/>
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png"/>
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png"/>
        <link rel="manifest" href="/site.webmanifest" />
      </Head>

      {/* Subtle Grid Backdrop */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>

      <div className="h-screen flex flex-col justify-between">
        <header className="h-24 mx-auto w-full max-w-[1440px] px-8 2xl:p-0 flex flex-row items-center gap-2">
          <Link href={"/"} className="cursor-pointer">
            <Image alt="SubTrack" width={265} height={30} src={"/subtrack_full.jpg"} />
          </Link>

          <div className="flex-1"></div>

          <div className="flex flex-row gap-0.5">
            <a href="https://cbuff.dev/projects/subtrack">
              <Button variant="link" className="flex flex-row gap-1">
                <span className="text-2xl">About</span>
                <IconExternalLink strokeWidth={1.5} /> 
              </Button>
            </a>

            <span className="text-lg font-bold self-center">·</span>

            <a href="/demo">
              <Button variant="link" className="flex flex-row gap-1">
                <span className="text-2xl">Demo</span>
                <IconExternalLink strokeWidth={1.5} /> 
              </Button>
            </a>

            <span className="text-lg font-bold self-center">·</span>

            <a href="https://github.com/C41M50N/SubTrack">
              <Button variant="link" className="flex flex-row gap-1">
                <span className="text-2xl">GitHub</span>
                <IconExternalLink strokeWidth={1.5} />
              </Button>
            </a>
          </div>

          <Separator orientation="vertical" className="h-2/5 bg-gray-500" />

          <Button className="ml-5 bg-black hover:bg-black/80 flex flex-row gap-4" variant="default" size="lg" onClick={() => signIn(provider.id)}>
            <Image alt="Google Icon" src="/google.svg" width={1} height={1} className="w-6 h-6" />
            <span className="font-semibold text-lg">Sign In with Google</span>
          </Button>
        </header>

        <section className="pt-24 mx-auto flex flex-col items-center justify-center gap-9 w-[720px]">
          <h1 className="text-7xl font-bold text-center">Organize Your Digital Subscriptions</h1>
          <h2 className="text-2xl text-center text-black/50">
            SubTrack is the simplest way to track how much your 
            digital subscriptions are costing you.
          </h2>
        </section>

        <section className="pt-24 pb-14 mx-auto max-w-[1200px] mb-auto px-8 2xl:px-0">
          <div className="border-[5px] border-black/70 rounded-xl">
            <Image className="mt-1" src={'/dashboard.png'} width={3000} height={2000} alt={"Dashboard Image"} />
          </div>
        </section>

        <footer className="bg-gray-50 h-16 flex">
          <div className="mx-auto my-auto">
            <span className="text-xs font-medium">
              Made by <Link href="https://www.linkedin.com/in/charles-buffington/" className="font-bold">Charles Buffington</Link>.
              All rights reserved.
            </span>
          </div>
        </footer>
      </div>
    </>
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
