import { toast } from "@/components/ui/use-toast";
import { api } from "@/utils/api";
import React from "react";

type TModalState = "open" | "closed";

export const useModalState = () => {
	const [state, setState] = React.useState<TModalState>("closed");
	return { state, setState } as const;
};

export type ModalState = ReturnType<typeof useModalState>;

export const useUserName = () => {
	const { mutateAsync: setUserName, isLoading: isSetUserNameLoading } =
		api.main.updateName.useMutation({
			onSuccess: () => {
				toast({
					variant: "success",
					title: "Successfully updated name!",
				});
			},
			onError: (err) => {
				toast({
					variant: "error",
					title: "Something went wrong...",
					description: err.message,
				});
			},
		});

	return { setUserName, isSetUserNameLoading };
};

export const useCategories = (enabled = true) => {
	const { data: categories, isInitialLoading: isCategoriesLoading } =
		api.categories.getCategories.useQuery(undefined, {
			staleTime: Number.POSITIVE_INFINITY,
			enabled: enabled,
		});
	return { categories, isCategoriesLoading } as const;
};

export const useSetCategories = () => {
	const ctx = api.useContext();
	const { mutateAsync: setCategories, isLoading: isSetCategoriesLoading } =
		api.categories.setCategories.useMutation({
			onSuccess: () => {
				toast({
					variant: "success",
					title: "Successfully set categories!",
				});
				ctx.categories.getCategories.refetch();
			},
			onError: (err) => {
				toast({
					variant: "error",
					title: "Something went wrong...",
					description: err.message,
				});
			},
		});
	return { setCategories, isSetCategoriesLoading };
};

export const useAllSubscriptions = () => {
	const { data: subscriptions } = api.subscriptions.getSubscriptions.useQuery(
		undefined,
		{ staleTime: Number.POSITIVE_INFINITY },
	);
	return { subscriptions } as const;
};

export const useCreateSubscription = () => {
	const ctx = api.useContext();
	const {
		mutateAsync: createSubscription,
		isLoading: isCreateSubscriptionLoading,
	} = api.subscriptions.createSubscription.useMutation({
		onSuccess: (_, newSubscription) => {
			toast({
				variant: "success",
				title: `Successfully created ${newSubscription.name} subscription!`,
			});
			ctx.subscriptions.getSubscriptionsFromCollection.invalidate();
		},
		onError: (err) => {
			toast({
				variant: "error",
				title: "Something went wrong...",
				description: err.message,
			});
		},
	});

	return { createSubscription, isCreateSubscriptionLoading };
};

export const useUpdateSubscription = (enabled = true) => {
	const ctx = api.useContext();
	const {
		mutateAsync: updateSubscription,
		isLoading: isUpdateSubscriptionLoading,
	} = api.subscriptions.updateSubscription.useMutation({
		onSuccess: () => {
			toast({
				variant: "success",
				title: "Successfully updated subscription!",
			});
			ctx.subscriptions.getSubscriptions.refetch();
		},
		onError: (err) => {
			toast({
				variant: "error",
				title: "Something went wrong...",
				description: err.message,
			});
		},
	});

	return { updateSubscription, isUpdateSubscriptionLoading };
};

export const useDeleteSubscription = () => {
	const ctx = api.useContext();
	const {
		mutateAsync: deleteSubscription,
		isLoading: isDeleteSubscriptionLoading,
	} = api.subscriptions.deleteSubscription.useMutation({
		onSuccess: () => {
			toast({
				variant: "success",
				title: "Successfully deleted subscription!",
			});
			ctx.subscriptions.getSubscriptions.refetch();
		},
		onError: (err) => {
			toast({
				variant: "error",
				title: "Something went wrong...",
				description: err.message,
			});
		},
	});

	return { deleteSubscription, isDeleteSubscriptionLoading };
};

export const useCollections = () => {
	const ctx = api.useContext();
	const { data: collections, isLoading: isGetCollectionsLoading } =
		api.collections.getCollections.useQuery(undefined, {
			staleTime: Number.POSITIVE_INFINITY,
		});

	return { collections, isGetCollectionsLoading };
};
