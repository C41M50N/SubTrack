import { TodoistApi } from "@doist/todoist-api-typescript";
import dayjs from "dayjs";

export const TodoistColors = [
	{ id: 30, name: "berry_red", color: "#b8256f" },
	{ id: 31, name: "red", color: "#db4035" },
	{ id: 32, name: "orange", color: "#ff9933" },
	{ id: 33, name: "yellow", color: "#fad000" },
	{ id: 34, name: "olive_green", color: "#afb83b" },
	{ id: 35, name: "lime_green", color: "#7ecc49" },
	{ id: 36, name: "green", color: "#299438" },
	{ id: 37, name: "mint_green", color: "#6accbc" },
	{ id: 38, name: "teal", color: "#158fad" },
	{ id: 39, name: "sky_blue", color: "#14aaf5" },
	{ id: 40, name: "light_blue", color: "#96c3eb" },
	{ id: 41, name: "blue", color: "#4073ff" },
	{ id: 42, name: "grape", color: "#884dff" },
	{ id: 43, name: "violet", color: "#af38eb" },
	{ id: 44, name: "lavender", color: "#eb96eb" },
	{ id: 45, name: "magenta", color: "#e05194" },
	{ id: 46, name: "salmon", color: "#ff8d85" },
	{ id: 47, name: "charcoal", color: "#808080" },
	{ id: 48, name: "grey", color: "#b8b8b8" },
	{ id: 49, name: "taupe", color: "#ccac93" },
] as const;

export type TodoistColor = (typeof TodoistColors)[number]["name"];
export type TodoistHexColor = (typeof TodoistColors)[number]["color"];

export type TodoistProject = {
	id: string;
	name: string;
	color: TodoistColor;
	hex_color: TodoistHexColor;
};

export function createTodoistAPI(apikey: string) {
	return new TodoistApi(apikey);
}

export async function sanityCheck(api: TodoistApi): Promise<void> {
	const projects = await api.getProjects();
	if (!projects) throw InvalidTodoistAPIKey();
}

export async function getProjects(api: TodoistApi): Promise<TodoistProject[]> {
	await sanityCheck(api);
	const projects = await api.getProjects();
	return projects.map((proj) => {
		const color = proj.color as TodoistColor;
		const colorHex = (
			TodoistColors.find(
				(colorObj) => colorObj.name === color,
			) as (typeof TodoistColors)[number]
		).color;
		return {
			id: proj.id,
			name: proj.name,
			color: proj.color as TodoistColor,
			hex_color: colorHex,
		};
	});
}

export async function getProjectName(
	api: TodoistApi,
	project_id: string,
): Promise<string> {
	await sanityCheck(api);
	const project = await api.getProject(project_id);
	if (!project) throw InvalidTodoistProject();
	return project.name;
}

export async function createReminder(
	api: TodoistApi,
	projectId: string,
	title: string,
	reminder_date: Date,
) {
	await sanityCheck(api);
	await api.addTask({
		content: `Cancel ${title} subscription`,
		dueDate: dayjs(reminder_date).format("YYYY-MM-DD"),
		priority: 1,
		projectId: projectId,
	});
}

export const InvalidTodoistAPIKey = () => new Error("Invalid Todoist API Key");
export const InvalidTodoistProject = () => new Error("Invalid Todoist Project");
