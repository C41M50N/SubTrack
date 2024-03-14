import z from "zod"
import React from "react";
import { useForm } from "react-hook-form"
import { useSession } from "next-auth/react";
import { zodResolver } from "@hookform/resolvers/zod";

import { api } from "@/utils/api";
import MainLayout from "@/layouts/main";
import SettingsLayout from "@/layouts/settings";
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

const TodoistAPIKeyFormSchema = z.object({
  key: z.string()
})

const TodoistProjectFormSchema = z.object({
  projectId: z.string()
})

export default function TodoistSettingsPage() {
  const { data: session } = useSession();
  const todoistAPIKeyForm = useForm<z.infer<typeof TodoistAPIKeyFormSchema>>({
    resolver: zodResolver(TodoistAPIKeyFormSchema),
    defaultValues: { key: session?.user.todoistAPIKey || "" }
  });
  const {
    mutate: setTodoistAPIKey,
    isLoading: isSetTodoistAPIKeyLoading
  } = api.main.setTodoistAPIKey.useMutation();
  const {
    mutate: removeTodoistAPIKey,
    isLoading: isRemoveTodoistAPIKeyLoading
  } = api.main.removeTodoistAPIKey.useMutation();

  const todoistProjectForm = useForm<z.infer<typeof TodoistProjectFormSchema>>({
    resolver: zodResolver(TodoistProjectFormSchema)
  });
  const {
    data: projects,
    isLoading: isGetTodoistProjectsLoading
  } = api.main.getTodoistProjects.useQuery(undefined, { staleTime: Infinity });
  const {
    mutate: setTodoistProject,
    isLoading: isSetTodoistProjectLoading
  } = api.main.setTodoistProject.useMutation();

  const projectId = todoistProjectForm.watch("projectId");

  React.useEffect(() => {
    if (session) {
      todoistAPIKeyForm.setValue(
        "key",
        session.user.todoistAPIKey
      );
    }
  }, [session]);

  React.useEffect(() => {
    console.log(todoistProjectForm)
    console.log(isGetTodoistProjectsLoading)
    if (!isGetTodoistProjectsLoading) {
      todoistProjectForm.setValue(
        "projectId",
        session!.user.todoistProjectId,
        { shouldDirty: true }
      );
    }
  }, [isGetTodoistProjectsLoading])

  return (
    <MainLayout title="Todoist Settings | SubTrack">
      <SettingsLayout>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium">Todoist Integration</h3>
            <p className="text-sm text-muted-foreground">
              Configure Todoist integration details. 
              The integration is optional and is only used for setting 
              cancel reminders for subscriptions.
            </p>
          </div>
          <Separator />
          
          <div className="w-full flex flex-row gap-10">
            {session && (
              <Form {...todoistAPIKeyForm}>
                <form 
                  className="space-y-4 max-w-sm w-full"
                  onSubmit={todoistAPIKeyForm.handleSubmit((values) => setTodoistAPIKey(values.key))}
                >
                  <FormField
                    control={todoistAPIKeyForm.control}
                    name="key"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">API Key</FormLabel>
                        <FormControl>
                          <Input className="max-w-sm" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="max-w-sm flex flex-row justify-between">
                    <Button type="submit" isLoading={isSetTodoistAPIKeyLoading}>
                      Save
                    </Button>

                    <Button
                      variant="destructive" 
                      onSubmit={() => removeTodoistAPIKey()} 
                      isLoading={isRemoveTodoistAPIKeyLoading}
                    >
                      Remove
                    </Button>
                  </div>
                </form>
              </Form>
            )}

            {todoistAPIKeyForm.getValues().key.trim() !== "" && !isGetTodoistProjectsLoading && projects && (
              <Form {...todoistProjectForm}>
                <form
                  className="space-y-4 max-w-xs w-full"
                  onSubmit={todoistProjectForm.handleSubmit((values) => setTodoistProject(values.projectId))}
                >
                  <FormField
                    control={todoistProjectForm.control}
                    defaultValue={projectId}
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

                  <Button type="submit" isLoading={isSetTodoistProjectLoading}>
                    Save
                  </Button>
                </form>
              </Form>
            )}
          </div>
        </div>
      </SettingsLayout>
    </MainLayout>
  )
}
