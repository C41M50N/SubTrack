import React from "react"
import { useSession } from "next-auth/react";
import { api } from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";

type TModalState = "open" | "closed"

export const useModalState = () => {
	const [state, setState] = React.useState<TModalState>("closed");
	return { state, setState } as const;
}

export type ModalState = ReturnType<typeof useModalState>


export const useCategories = () => {
	const ctx = api.useContext()
  const { data: categories, isLoading: isCategoriesLoading } = api.main.getCategories.useQuery(undefined, { staleTime: Infinity, cacheTime: Infinity })
	function invalidate() {
		ctx.main.getCategories.invalidate()
	}
	return { categories, isCategoriesLoading, invalidate } as const
}

export const useSetCategories = () => {
	const ctx = api.useContext()
	const { mutate: setCategories, isLoading: isSetCategoriesLoading } = api.main.setCategories.useMutation({
		onSuccess: () => {
			ctx.main.getCategories.refetch()
		},
		onError: () => {
			
		}
	})
	return { setCategories, isSetCategoriesLoading }
}

export const useAllSubscriptions = () => {
  const { data: subscriptions } = api.main.getSubscriptions.useQuery(undefined, { staleTime: Infinity, cacheTime: Infinity })
	return { subscriptions } as const
}

export const useCreateSubscription = (before: () => void, after: () => void) => {
	const { toast } = useToast()
	const ctx = api.useContext()
	const session = useSession()
	const { subscriptions } = useAllSubscriptions()
	const { mutate: createSubscription, isLoading: isCreateSubscriptionLoading } = api.main.createSubscription.useMutation({
    onSuccess: (_, newSubscription) => {
			before()
      ctx.main.getSubscriptions.setData(undefined, [...subscriptions!, { ...newSubscription, userId: session.data!.user.id, id: "" }])
			toast({
				variant: "success",
				title: `Successfully created ${newSubscription.name} subscription!`
			})
			after()
    }
  })

	return { createSubscription, isCreateSubscriptionLoading }
}

export const useUpdateSubscription = (before: () => void, after: () => void) => {
	const ctx = api.useContext()
	const { mutate: updateSubscription, isLoading: isUpdateSubscriptionLoading } = api.main.updateSubscription.useMutation({
		onSuccess: () => {
			before()
			ctx.main.getSubscriptions.invalidate()
			after()
		}
	})

	return { updateSubscription, isUpdateSubscriptionLoading }
}

export const useDeleteSubscription = (subscription_id: string, before: () => void, after: () => void) => {
	const { toast } = useToast()
	const ctx = api.useContext()
	const { subscriptions } = useAllSubscriptions()
	const { mutate: deleteSubscription, isLoading: isDeleteSubscriptionLoading } = api.main.deleteSubscription.useMutation({
		onSuccess: () => {
			before()
			ctx.main.getSubscriptions.setData(undefined, [...subscriptions!.filter((sub) => sub.id !== subscription_id)])
			toast({
				variant: "destructive",
				title: `Successfully deleted subscription.`
			})
			after()
		}
	})

	return { deleteSubscription, isDeleteSubscriptionLoading }
}
