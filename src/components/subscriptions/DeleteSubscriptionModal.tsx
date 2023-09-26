import React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Subscription } from "@/lib/types"
import { ModalState } from "@/lib/hooks"
import { IconTrash } from "@tabler/icons-react"

type DeleteSubscriptionModalProps = {
  state: ModalState
  subscription_id: Subscription["id"]
}

export default function DeleteSubscriptionModal ({ state, subscription_id }: DeleteSubscriptionModalProps) {

  const deleteSubscription = (subscription_id: Subscription["id"]) => {}

  return (
    <Dialog open={state.state === "open" ? true : false} onOpenChange={(open) => !open && state.setState("closed")}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Subscription</DialogTitle>
          <DialogDescription>
            This action cannot be undone. Are you sure you want to permanently
            delete this file from our servers?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant={"destructive"} type="submit" onClick={() => deleteSubscription(subscription_id)} className="gap-1"><IconTrash size={20} /> Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
