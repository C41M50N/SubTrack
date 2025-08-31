import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeftIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { GetServerSidePropsContext } from 'next/types';
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { authClient } from '@/features/auth/auth-client';
import AuthLayout from '@/layouts/auth';
import { getServerAuthSession } from '@/server/api/trpc';

const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});

export default function ForgotPasswordPage() {
  const [loading, setLoading] = React.useState<boolean>(false);

  const form = useForm<z.infer<typeof ForgotPasswordSchema>>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  async function onSubmit(values: z.infer<typeof ForgotPasswordSchema>) {
    await authClient.forgetPassword({
      email: values.email,
      redirectTo: '/auth/reset-password',
      fetchOptions: {
        onRequest: () => setLoading(true),
        onResponse: () => setLoading(false),
        onError(ctx) {
          toast({
            variant: 'error',
            title: 'Something went wrong',
            description: ctx.error.message,
          });
        },
      },
    });
  }

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
            <div className="mx-auto space-y-1 pb-6">
              <h3 className="text-center font-semibold text-2xl">
                Forgot Password?
              </h3>
              <p className="text-center text-muted-foreground text-sm">
                No worries, we'll send you reset instructions.
              </p>
            </div>
            <Form {...form}>
              <form
                className="space-y-4"
                onSubmit={form.handleSubmit(onSubmit)}
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your email"
                          {...field}
                          type="email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button className="w-full" isLoading={loading} type="submit">
                  Request password reset
                </Button>
              </form>
            </Form>
            <div className="pt-6">
              <Link href="/auth/login">
                <Button className="w-full gap-2" variant="ghost">
                  <ArrowLeftIcon className="size-4" />
                  Back to log in
                </Button>
              </Link>
            </div>
          </CardContent>
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
