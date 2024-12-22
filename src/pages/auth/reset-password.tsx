import React from "react";
import type {
  GetServerSidePropsContext,
  InferGetServerSidePropsType
} from "next";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { ArrowLeftIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { PasswordSchema } from "@/features/auth";
import { authClient } from "@/features/auth/auth-client";

const ResetPasswordSchema = z
  .object({
    password: PasswordSchema,
    confirm: PasswordSchema
  })
  .refine((data) => data.password === data.confirm, {
    message: "passwords do not match",
    path: ["confirm"]
  });

export default function ResetPasswordPage({
  token
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const router = useRouter();
  const [loading, setLoading] = React.useState<boolean>(false);

  const form = useForm<z.infer<typeof ResetPasswordSchema>>({
    resolver: zodResolver(ResetPasswordSchema),
  })

  async function onSubmit(values: z.infer<typeof ResetPasswordSchema>) {
    await authClient.resetPassword({
      newPassword: values.password,
      token: token,
      fetchOptions: {
        onRequest: () => setLoading(true),
        onResponse: () => setLoading(false),
        onError(ctx) {
          toast({
            variant: "error",
            title: "Something went wrong",
            description: ctx.error.message,
          })
        },
        onSuccess(ctx) {
          router.push("/auth/login")
        }
      }
    })
  }

  return (
    <div className="h-screen sm:-mt-10 flex justify-center items-center">
      <div className="w-[450px]">
        <Card className="w-full px-4 sm:px-6 pt-1 pb-4 shadow-none sm:shadow-xl border-none sm:border">
          <CardHeader>
            <div className="mx-auto pb-1">
              <Image
                alt="SubTrack"
                width={225}
                height={34}
                src={"/subtrack_full.jpg"}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="mx-auto pb-6 space-y-1">
              <h3 className="text-xl text-center font-semibold">
                Set new password
              </h3>
            </div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

                <Button type="submit" isLoading={loading} className="w-full">
                  Reset password
                </Button>
              </form>
            </Form>
            <div className="pt-6">
              <Link href="/auth/login">
                <Button variant="ghost" className="w-full gap-2">
                  <ArrowLeftIcon className="size-4" />
                  Back to log in
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const token = ctx.query.token as string | undefined;
  const error = ctx.query.error as string | undefined;

  if (error) {
    return {
      redirect: { destination: "/auth/login?error=password_reset_failure" }
    }
  }

  if (!token) {
    return {
      redirect: { destination: "/auth/login" }
    }
  }

  return {
    props: {
      token
    }
  }
}
