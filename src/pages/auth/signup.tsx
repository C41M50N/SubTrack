import Image from 'next/image';
import type { GetServerSidePropsContext } from 'next/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { signIn } from '@/features/auth/auth-client';
import AuthLayout from '@/layouts/auth';
import { getServerAuthSession } from '@/server/api/trpc';

export default function SignUpPage() {
  return (
    <AuthLayout>
      <div className="w-[450px]">
        <Card className="w-full border-none px-4 pt-1 pb-4 shadow-none sm:border sm:px-6 sm:shadow-xl">
          <CardHeader>
            <div className="mx-auto pb-1">
              <Image
                alt="SubTrack"
                height={34}
                src={'/subtrack_full.jpg'}
                width={225}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="flex flex-row items-center gap-x-4 px-3">
                <div className="flex-1">
                  <Separator />
                </div>
                <span className="text-muted-foreground text-sm leading-none">
                  or
                </span>
                <div className="flex-1">
                  <Separator />
                </div>
              </div>

              <div className="flex w-full flex-col items-center justify-between gap-2">
                <Button
                  className="w-full gap-3"
                  onClick={async () => {
                    await signIn.social({
                      provider: 'google',
                      callbackURL: '/dashboard',
                    });
                  }}
                  variant="outline"
                >
                  <Image
                    alt="Google Icon"
                    className="size-4"
                    height={20}
                    src="/google.svg"
                    width={20}
                  />
                  Sign in with Google
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <div className="flex w-full justify-center pt-4">
              <p className="text-center text-muted-foreground text-xs">
                Secured by{' '}
                <a
                  className="underline"
                  href="https://better-auth.com"
                  rel="noreferrer"
                  target="_blank"
                >
                  <span className="font-medium text-[#40516f]">
                    better-auth
                  </span>
                </a>
                .
              </p>
            </div>
          </CardFooter>
        </Card>
      </div>
    </AuthLayout>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerAuthSession(context.req);
  if (session) {
    return {
      redirect: {
        destination: '/dashboard',
      },
    };
  }

  return { props: {} };
}
