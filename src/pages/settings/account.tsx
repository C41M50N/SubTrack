import z from "zod"
import { useForm } from "react-hook-form"
import { useSession } from "next-auth/react";
import { zodResolver } from "@hookform/resolvers/zod";

import { api } from "@/utils/api";
import MainLayout from "@/layouts/main";
import SettingsLayout from "@/layouts/settings";
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

const AccountFormSchema = z.object({
  name: z.string()
})

export default function AccountSettingsPage() {
  const { data: session } = useSession()
  const form = useForm<z.infer<typeof AccountFormSchema>>({
    resolver: zodResolver(AccountFormSchema),
    defaultValues: { name: session?.user.name || "" }
  })

  const { mutate, isLoading } = api.main.updateName.useMutation()

  function onSubmit(values: z.infer<typeof AccountFormSchema>) {
    mutate(values.name);
  }

  return (
    <MainLayout>
      <SettingsLayout>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium">Account</h3>
            <p className="text-sm text-muted-foreground">
              View your account information.
              Update your account settings. Set your preferred language and
              timezone.
            </p>
          </div>
          <Separator />
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormItem>
                  <FormLabel className="text-base">Email</FormLabel>
                  <FormControl>
                    <Input disabled value={session?.user.email ?? ""} />
                  </FormControl>
                </FormItem>
              </div>

              <Button type="submit" isLoading={isLoading} className="gap-1">
                <span>Save</span>
              </Button>
            </form>
          </Form>
        </div>
      </SettingsLayout>
    </MainLayout>
  )
}