import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { GetServerSidePropsContext } from 'next/types';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';
import { signIn } from '@/features/auth/auth-client';
import AuthLayout from '@/layouts/auth';
import { createCaller } from '@/server/api/root';
import { getServerAuthSession } from '@/server/api/trpc';
import { prisma } from '@/server/db';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

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
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  onChange={(e) => {
                    setEmail(e.target.value);
                  }}
                  required
                  type="email"
                  value={email}
                />
              </div>

              <div className="grid gap-2">
                <div className="flex items-baseline">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    className="ml-auto inline-block text-xs underline"
                    href="/auth/forgot-password"
                  >
                    Forgot your password?
                  </Link>
                </div>

                <Input
                  autoComplete="password"
                  id="password"
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  value={password}
                />
              </div>

              <Button
                className="w-full"
                disabled={loading}
                onClick={async () => {
                  await signIn.email({
                    email,
                    password,
                    fetchOptions: {
                      onResponse: () => {
                        setLoading(false);
                      },
                      onRequest: () => {
                        setLoading(true);
                      },
                      onError: (ctx) => {
                        toast({
                          variant: 'error',
                          title: 'Something went wrong',
                          description: ctx.error.message,
                        });
                      },
                      onSuccess: async () => {
                        router.push('/dashboard');
                      },
                    },
                  });
                }}
                type="submit"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  'Login'
                )}
              </Button>

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
