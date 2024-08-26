import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";
import z from "zod";

import { LoadingSpinner } from "@/components/common/loading-spinner";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import MainLayout from "@/layouts/main";
import SettingsLayout from "@/layouts/settings";
import { useUser } from "@/lib/hooks";
import { api } from "@/utils/api";

const TodoistProjectFormSchema = z.object({
	projectId: z.string(),
});

export default function TodoistDebugSettingsPage() {
	const { user } = useUser();

	const { data: projects, isLoading: isGetTodoistProjectsLoading } =
		api.main.getTodoistProjects.useQuery(undefined, {
			staleTime: Number.POSITIVE_INFINITY,
		});

	const todoistProjectForm = useForm<z.infer<typeof TodoistProjectFormSchema>>({
		resolver: zodResolver(TodoistProjectFormSchema),
	});

	const projectId = todoistProjectForm.watch("projectId");

	React.useEffect(() => {
		if (user && user.todoistProjectId !== "") {
			todoistProjectForm.setValue("projectId", user.todoistProjectId);
			console.log("Setting form value", user.todoistProjectId);
		}
	}, [projects]);

	return (
		<MainLayout>
			<SettingsLayout>
				{isGetTodoistProjectsLoading && !projects && <LoadingSpinner />}
				{!isGetTodoistProjectsLoading && projects && (
					<Form {...todoistProjectForm}>
						<form
							className="space-y-4 max-w-xs w-full"
							onSubmit={todoistProjectForm.handleSubmit((values) =>
								todoistProjectForm.setValue("projectId", "2325471566"),
							)}
						>
							<FormField
								control={todoistProjectForm.control}
								name="projectId"
								render={({ field }) => (
									<FormItem className="max-w-xs">
										<FormLabel className="text-base">Project</FormLabel>
										<Select onValueChange={field.onChange} value={field.value}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select a project" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectGroup>
													{projects.map((proj) => (
														<SelectItem value={proj.id} key={proj.id}>
															<span className="flex flex-row items-center gap-2">
																<span
																	style={{ color: proj.hex_color }}
																	className="font-mono font-semibold italic text-base"
																>
																	#
																</span>
																<span className="font-medium">{proj.name}</span>
															</span>
														</SelectItem>
													))}
												</SelectGroup>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>

							<Button type="submit">Save {projectId}</Button>
						</form>
					</Form>
				)}
			</SettingsLayout>
		</MainLayout>
	);
}
