import React from "react"
import { api } from "@/utils/api";
import { toast } from "@/components/ui/use-toast";

type TModalState = "open" | "closed"

export const useModalState = () => {
	const [state, setState] = React.useState<TModalState>("closed");
	return { state, setState } as const;
}

export type ModalState = ReturnType<typeof useModalState>


export const useUserName = () => {
	const {
		mutateAsync: setUserName,
		isLoading: isSetUserNameLoading
	} = api.main.updateName.useMutation({
		onSuccess: () => {
			toast({
				variant: "success",
				title: "Successfully updated name!"
			})
		},
		onError: (err) => {
			toast({
				variant: "error",
				title: `Something went wrong...`,
				description: err.message
			})
		}
	})

	return { setUserName, isSetUserNameLoading }
}

export const useCategories = () => {
  const { 
		data: categories, 
		isLoading: isCategoriesLoading 
	} = api.main.getCategories.useQuery(undefined, { staleTime: Infinity })
	return { categories, isCategoriesLoading } as const
}

export const useSetCategories = () => {
	const ctx = api.useContext()
	const { 
		mutateAsync: setCategories, 
		isLoading: isSetCategoriesLoading 
	} = api.main.setCategories.useMutation({
		onSuccess: () => {
			toast({
				variant: "success",
				title: "Successfully set categories!"
			})
			ctx.main.getCategories.refetch()
		},
		onError: (err) => {
			toast({
				variant: "error",
				title: `Something went wrong...`,
				description: err.message
			})
		}
	})
	return { setCategories, isSetCategoriesLoading }
}

export const useAllSubscriptions = () => {
  const {
		data: subscriptions, 
	} = api.main.getSubscriptions.useQuery(undefined, { staleTime: Infinity })
	return { subscriptions } as const
}

export const useCreateSubscription = () => {
	const ctx = api.useContext()
	const { 
		mutateAsync: createSubscription, 
		isLoading: isCreateSubscriptionLoading 
	} = api.main.createSubscription.useMutation({
    onSuccess: (_, newSubscription) => {
			toast({
				variant: "success",
				title: `Successfully created ${newSubscription.name} subscription!`
			})
			ctx.main.getSubscriptions.refetch()
    },
		onError: (err) => {
			toast({
				variant: "error",
				title: `Something went wrong...`,
				description: err.message
			})
		}
  })

	return { createSubscription, isCreateSubscriptionLoading }
}

export const useUpdateSubscription = () => {
	const ctx = api.useContext()
	const { 
		mutateAsync: updateSubscription, 
		isLoading: isUpdateSubscriptionLoading 
	} = api.main.updateSubscription.useMutation({
		onSuccess: () => {
			toast({
				variant: "success",
				title: "Successfully updated subscription!"
			})
			ctx.main.getSubscriptions.refetch()
		},
		onError: (err) => {
			toast({
				variant: "error",
				title: `Something went wrong...`,
				description: err.message
			})
		}
	})

	return { updateSubscription, isUpdateSubscriptionLoading }
}

export const useDeleteSubscription = () => {
	const ctx = api.useContext()
	const { 
		mutateAsync: deleteSubscription, 
		isLoading: isDeleteSubscriptionLoading 
	} = api.main.deleteSubscription.useMutation({
		onSuccess: () => {
			toast({
				variant: "success",
				title: `Successfully deleted subscription!`
			})
			ctx.main.getSubscriptions.refetch()
		},
		onError: (err) => {
			toast({
				variant: "error",
				title: `Something went wrong...`,
				description: err.message
			})
		}
	})

	return { deleteSubscription, isDeleteSubscriptionLoading }
}
