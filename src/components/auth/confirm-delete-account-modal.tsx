import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
  DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import type { ModalState } from "@/lib/hooks";
import { api } from "@/utils/api";
import { Trash2Icon } from "lucide-react";
import { useRouter } from "next/router";
import { toast } from "../ui/use-toast";

type ConfirmDeleteAccountModalProps = {
  state: ModalState;
}

export default function ConfirmDeleteAccountModal({
  state
}: ConfirmDeleteAccountModalProps) {
  const router = useRouter();

  const {
		mutate: deleteUser,
		isLoading: isDeleteUserLoading
	} = api.main.deleteUser.useMutation({
		onError(error) {
			toast({
        variant: "error",
        title: "Failed to delete account at this time",
        description: error.message,
      })
		},
		onSuccess() {
			router.push("/");
		},
	})

  return (
    <Dialog
			open={state.state === "open"}
			onOpenChange={(open) => !open && state.setState("closed")}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Delete Note</DialogTitle>
					<DialogDescription>
						Are you sure you want to permanently delete your account and all of your subscription data?
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
          <Button variant={"secondary"} onClick={() => state.setState("closed")}>
						Cancel
          </Button>
					<Button
						variant={"destructive"}
						isLoading={isDeleteUserLoading}
						onClick={() => deleteUser()}
						className="gap-1"
					>
						<Trash2Icon size={20} strokeWidth={1.75} />
						<span>Delete</span>
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
  )
}
