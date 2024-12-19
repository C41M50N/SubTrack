import { Slot } from "@radix-ui/react-slot";
import { type VariantProps, cva } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import * as React from "react";

import { cn } from "@/utils";

const buttonVariants = cva(
	"inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
	{
		variants: {
			variant: {
				default:
					"bg-[#516282] text-primary-foreground hover:bg-[#516282]/90 border border-gray-300",
				destructive:
					"bg-destructive text-destructive-foreground hover:bg-destructive/90",
				"primary-2":
					"bg-[#136df4b8] hover:bg-[#136df4a6] text-primary-foreground border border-[#448bf4] transition ease-out duration-200",
				"outline-2":
					"bg-[#136df41d] hover:bg-[#136df430] text-secondary-foreground border border-[#448bf4] transition ease-out duration-200",
				"secondary-2":
					"bg-[#136df433] hover:bg-[#136df450] text-secondary-foreground transition ease-out duration-200",
				outline:
					"border border-input bg-background hover:bg-accent hover:text-accent-foreground",
				secondary:
					"bg-[#ebeced]/70 text-secondary-foreground hover:bg-[#ebeced]",
				ghost: "hover:bg-accent hover:text-accent-foreground",
				ghost_link:
					"hover:bg-accent hover:text-accent-foreground underline-offset-4 hover:underline",
				link: "text-primary underline-offset-4 hover:underline",
			},
			size: {
				default: "h-10 px-4 py-2",
				sm: "h-9 rounded-md px-3",
				lg: "h-11 rounded-md px-8",
				icon: "h-10 w-10 p-0",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonVariants> {
	asChild?: boolean;
	isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	(
		{
			className,
			variant,
			size,
			asChild = false,
			isLoading = false,
			children,
			...props
		},
		ref,
	) => {
		const Comp = asChild ? Slot : "button";
		return (
			<Comp
				className={cn(buttonVariants({ variant, size, className }))}
				ref={ref}
				{...props}
			>
				{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
				{children}
			</Comp>
		);
	},
);
Button.displayName = "Button";

export { Button, buttonVariants };
