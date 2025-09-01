import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeftIcon } from 'lucide-react';
import type {
  GetServerSidePropsContext,
  InferGetServerSidePropsType,
} from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { PasswordSchema } from '@/features/auth';
import { authClient } from '@/features/auth/auth-client';
import AuthLayout from '@/layouts/auth';
import { getServerAuthSession } from '@/server/api/trpc';

const ResetPasswordSchema = z
  .object({
    password: PasswordSchema,
    confirm: PasswordSchema,
  })
  .refine((data) => data.password === data.confirm, {
    message: 'passwords do not match',
    path: ['confirm'],
  });

export default function ResetPasswordPage({
  token,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const router = useRouter();
  const [loading, setLoading] = React.useState<boolean>(false);

  const form = useForm<z.infer<typeof ResetPasswordSchema>>({
    resolver: zodResolver(ResetPasswordSchema),
  });

  async function onSubmit(values: z.infer<typeof ResetPasswordSchema>) {
    await authClient.resetPassword({
      newPassword: values.password,
      token,
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
        onSuccess() {
          router.push('/auth/login');
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
              <h3 className="text-center font-semibold text-xl">
                Set new password
              </h3>
            </div>
            <Form {...form}>
              <form
                className="space-y-4"
                onSubmit={form.handleSubmit(onSubmit)}
              >
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm password</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button className="w-full" isLoading={loading} type="submit">
                  Reset password
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

  const token = context.query.token as string | undefined;
  const error = context.query.error as string | undefined;

  if (error) {
    return {
      redirect: { destination: '/auth/login?error=password_reset_failure' },
    };
  }

  if (!token) {
    return {
      redirect: { destination: '/auth/login' },
    };
  }

  return {
    props: {
      token,
    },
  };
}
