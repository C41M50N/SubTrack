"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronsUpDown } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
} from "@/components/ui/command";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "@/components/ui/use-toast";
import MainLayout from "@/layouts/main";
import SettingsLayout from "@/layouts/settings";
import { cn } from "@/utils";


export default function UIDebugPage() {
	return (
		<MainLayout>
			<SettingsLayout>
				<div className="space-y-2">
					<div className="flex flex-row space-x-2">
						<Button className="w-[130px]" variant="default">
							Primary
						</Button>
						<Button className="w-[130px]" variant="secondary">
							Secondary
						</Button>
						<Button className="w-[130px]" variant="outline">
							Outline
						</Button>
					</div>
					<div className="flex flex-row space-x-2">
						<Button className="w-[130px]" variant="primary-2">
							Primary 2
						</Button>
						<Button className="w-[130px]" variant="secondary-2">
							Secondary 2
						</Button>
						<Button className="w-[130px]" variant="outline-2">
							Outline 2
						</Button>
					</div>
				</div>
			</SettingsLayout>
		</MainLayout>
	);
}
