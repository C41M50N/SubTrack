import MainLayout from "@/layouts/main";
import SettingsLayout from "@/layouts/settings";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

export default function ToastDebugPage() {
  return (
    <MainLayout>
      <SettingsLayout>
        <div className="flex flex-row gap-3">
          <Button onClick={() => toast({ variant: "success", title: "Successfully created a thing" })}>
            Success
          </Button>
          <Button onClick={() => toast({ variant: "error", title: "Something went wrong..." })}>
            Error
          </Button>
          <Button onClick={() => toast({ variant: "destructive", title: "Successfully deleted a thing" })}>
            Destructive
          </Button>
        </div>
      </SettingsLayout>
    </MainLayout>
  )
}
