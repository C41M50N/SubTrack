import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { z } from "zod";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export async function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export function toProperCase(str: string): string {
	let result = "";
	if (str.includes(".")) {
		result = str.split(".")[0] as string;
	} else {
		result = str;
	}

	let parts: string[] = [];
	if (result.includes("-")) {
		parts = result.split("-");
	} else {
		parts = [result, " "];
	}
	return parts
		.reduce(
			(a, b) =>
				`${
					a.at(0)?.toUpperCase() + a.slice(1)
				} ${b.at(0)?.toUpperCase()}${b.slice(1)}`,
		)
		.trim();
}

export function toMoneyString(amount: number): string {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
	}).format(amount / 100);
}

export function downloadFile(file: File) {
	// Create a URL for the file
	const fileUrl = URL.createObjectURL(file);

	// Create a temporary anchor element
	const link = document.createElement("a");
	link.href = fileUrl;
	link.download = file.name; // Uses the filename you specified

	// Append to document, click, and cleanup
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);

	// Clean up the URL object
	URL.revokeObjectURL(fileUrl);
}

export function parseJSON<T>(json: string, schema: z.Schema<T>) {
	const stringToJSONSchema = z
		.string()
		.transform((str, ctx): z.infer<typeof schema> => {
			try {
				const obj = JSON.parse(str);
				return schema.parse(obj);
			} catch (e) {
				ctx.addIssue({ code: "custom", message: "Invalid JSON format" });
				return z.NEVER;
			}
		});

	return stringToJSONSchema.parse(json);
}
