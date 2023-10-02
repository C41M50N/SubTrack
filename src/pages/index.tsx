import Head from "next/head";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";

export default function Home() {
  const { data: sessionData } = useSession();

  return (
    <>
      <Head>
        <title>SubTrack: Track. Remind. Assess.</title>
        <meta name="description" content="SubTrack " />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b">
        {sessionData && (
          <Button variant={"link"}>
            <Link href={"/dashboard"}>Dashboard</Link>
          </Button>
        )}
        {!sessionData && <Button onClick={() => signIn()}>Login</Button>}
      </main>
    </>
  );
}
