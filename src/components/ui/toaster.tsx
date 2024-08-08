import {
	Toast,
	ToastClose,
	ToastDescription,
	ToastProvider,
	ToastTitle,
	ToastViewport,
} from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";
import { AlertTriangle, CheckCircle, Trash } from "lucide-react";

export function Toaster() {
	const { toasts } = useToast();

	return (
		<ToastProvider>
			{toasts.map(({ id, title, description, action, ...props }) => (
				<Toast key={id} {...props}>
					<div className="flex flex-row items-center gap-3">
						{props.variant === "success" && (
							<CheckCircle className="w-6 h-6 text-green-600" />
						)}
						{props.variant === "error" && (
							<AlertTriangle className="w-6 h-6 text-[#d84750]" />
						)}
						{props.variant === "destructive" && (
							<Trash className="w-6 h-6 text-red-600" />
						)}

						<div className="grid gap-1">
							{title && <ToastTitle>{title}</ToastTitle>}
							{description && (
								<ToastDescription>{description}</ToastDescription>
							)}
						</div>
						{action}
						<ToastClose />
					</div>
				</Toast>
			))}
			<ToastViewport />
		</ToastProvider>
	);
}
