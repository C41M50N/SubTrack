import { SearchIcon } from "lucide-react";
import { Input } from "../ui/input";

export interface InputProps
	extends React.InputHTMLAttributes<HTMLInputElement> {
	variant?: "sm" | "normal";
}

export function SearchInput({ className, ...props }: InputProps) {
	return (
		<div className="relative flex items-center justify-center">
			<SearchIcon className="absolute left-2.5 top-3 size-4 text-muted-foreground" />
			<Input placeholder="Search" className={`pl-9 ${className}`} {...props} />
		</div>
	);
}
