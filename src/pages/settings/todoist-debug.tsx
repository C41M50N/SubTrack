import z from "zod"
import React from "react";
import { useForm } from "react-hook-form"
import { useSession } from "next-auth/react";
import { zodResolver } from "@hookform/resolvers/zod";

import { api } from "@/utils/api";
import MainLayout from "@/layouts/main";
import SettingsLayout from "@/layouts/settings";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { LoadingSpinner } from "@/components/common/loading-spinner";

const TodoistProjectFormSchema = z.object({
  projectId: z.string()
})

export default function TodoistDebugSettingsPage() {

  const { data: session } = useSession();

  const {
    data: projects,
    isLoading: isGetTodoistProjectsLoading
  } = api.main.getTodoistProjects.useQuery(undefined, { staleTime: Infinity });

  const todoistProjectForm = useForm<z.infer<typeof TodoistProjectFormSchema>>({
    resolver: zodResolver(TodoistProjectFormSchema)
  });

  const projectId = todoistProjectForm.watch("projectId");

  React.useEffect(() => {
    if (session && session.user.todoistProjectId !== "") {
      todoistProjectForm.setValue("projectId", session.user.todoistProjectId);
      console.log("Setting form value", session.user.todoistProjectId);
    }
  }, [projects]);

  return (
    <MainLayout>
      <SettingsLayout>
        {isGetTodoistProjectsLoading && !projects && (<LoadingSpinner />)}
        {!isGetTodoistProjectsLoading && projects && (
          <Form {...todoistProjectForm}>
            <form
              className="space-y-4 max-w-xs w-full"
              onSubmit={todoistProjectForm.handleSubmit((values) => todoistProjectForm.setValue("projectId", "2325471566"))}
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
                                <span style={{ color: proj.hex_color }} className={`font-mono font-semibold italic text-base`}>#</span>
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

              <Button type="submit">
                Save {projectId}
              </Button>
            </form>
          </Form>
        )}
      </SettingsLayout>
    </MainLayout>
  )
}
