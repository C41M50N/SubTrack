import MainLayout from "@/layouts/main";
import SettingsLayout from "@/layouts/settings";
import { Separator } from "@/components/ui/separator";

export default function AccountSettingsPage() {
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
          {/* <AccountForm /> */}
        </div>
      </SettingsLayout>
    </MainLayout>
  )
}