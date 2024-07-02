import { IconTrash } from "@tabler/icons-react"
import React from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useDeleteSubscription, type ModalState } from "@/lib/hooks"
import { type Subscription } from "@/lib/types"
import { useDemoSubscriptions } from "@/lib/stores/demo-subscriptions"
import { sleep } from "@/lib/utils"

type DeleteSubscriptionModalProps = {
  state: ModalState
  subscription_id: Subscription["id"]
  demo?: boolean
}

export default function DeleteSubscriptionModal ({ state, subscription_id, demo = false }: DeleteSubscriptionModalProps) {

  const { deleteSubscription, isDeleteSubscriptionLoading } = useDeleteSubscription()
  const { removeSubscription } = useDemoSubscriptions()

  async function onSubmit() {
    if (demo) {
      await sleep(500)
      removeSubscription(subscription_id)
    } else {
      await deleteSubscription(subscription_id)
    }
    
    state.setState("closed")
  }

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
          <Button type="submit" variant={"destructive"} isLoading={isDeleteSubscriptionLoading} onClick={onSubmit} className="gap-1">
            <IconTrash size={20} strokeWidth={1.75} />
            <span>Delete</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
