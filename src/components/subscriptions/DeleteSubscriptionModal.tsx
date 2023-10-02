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
import { api } from "@/utils/api"

type DeleteSubscriptionModalProps = {
  state: ModalState
  subscription_id: Subscription["id"]
}

export default function DeleteSubscriptionModal ({ state, subscription_id }: DeleteSubscriptionModalProps) {

  const utils = api.useContext()
  const { data: subscriptions } = api.main.getSubscriptions.useQuery(undefined, { staleTime: Infinity, cacheTime: Infinity })

  const { mutate } = api.main.deleteSubscription.useMutation({
    onSuccess: () => {
      utils.main.getSubscriptions.setData(undefined, [...subscriptions!.filter((sub) => sub.id !== subscription_id)])
      state.setState("closed")
    }
  })

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
          <Button variant={"destructive"} type="submit" onClick={() => mutate(subscription_id)} className="gap-1"><IconTrash size={20} /> Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
