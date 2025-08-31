import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';
import { useForm } from 'react-hook-form';
import z from 'zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import MainLayout from '@/layouts/main';
import SettingsLayout from '@/layouts/settings';
import { useUser } from '@/lib/hooks';
import { api } from '@/utils/api';

const TodoistAPIKeyFormSchema = z.object({
  key: z.string(),
});

const TodoistProjectFormSchema = z.object({
  projectId: z.string(),
});

export default function TodoistSettingsPage() {
  const { user } = useUser();

  const todoistAPIKeyForm = useForm<z.infer<typeof TodoistAPIKeyFormSchema>>({
    resolver: zodResolver(TodoistAPIKeyFormSchema),
    defaultValues: { key: user?.todoistAPIKey || '' },
  });
  const { mutate: setTodoistAPIKey, isLoading: isSetTodoistAPIKeyLoading } =
    api.main.setTodoistAPIKey.useMutation();
  const {
    mutate: removeTodoistAPIKey,
    isLoading: isRemoveTodoistAPIKeyLoading,
  } = api.main.removeTodoistAPIKey.useMutation();

  const todoistProjectForm = useForm<z.infer<typeof TodoistProjectFormSchema>>({
    resolver: zodResolver(TodoistProjectFormSchema),
  });
  const { data: projects, isLoading: isGetTodoistProjectsLoading } =
    api.main.getTodoistProjects.useQuery(undefined, {
      staleTime: Number.POSITIVE_INFINITY,
      retry: 0,
      enabled:
        user?.todoistAPIKey !== undefined && user.todoistAPIKey.length > 0,
    });
  const { mutate: setTodoistProject, isLoading: isSetTodoistProjectLoading } =
    api.main.setTodoistProject.useMutation();

  const projectId = todoistProjectForm.watch('projectId');

  React.useEffect(() => {
    console.log(todoistProjectForm);
    console.log(isGetTodoistProjectsLoading);
    if (user && !isGetTodoistProjectsLoading) {
      todoistProjectForm.setValue('projectId', user.todoistProjectId, {
        shouldDirty: true,
      });
    }
  }, [isGetTodoistProjectsLoading]);

  return (
    <MainLayout title="Todoist Settings | SubTrack">
      <SettingsLayout>
        <div className="space-y-6">
          <div>
            <h3 className="font-medium text-lg">Todoist Integration</h3>
            <p className="text-muted-foreground text-sm">
              Configure Todoist integration details. The integration is optional
              and is only used for setting cancel reminders for subscriptions.
            </p>
          </div>
          <Separator />

          <div className="flex w-full flex-row gap-10">
            {user && (
              <Form {...todoistAPIKeyForm}>
                <form
                  className="w-full max-w-sm space-y-4"
                  onSubmit={todoistAPIKeyForm.handleSubmit((values) =>
                    setTodoistAPIKey(values.key)
                  )}
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

                  <div className="flex max-w-sm flex-row justify-between">
                    <Button isLoading={isSetTodoistAPIKeyLoading} type="submit">
                      Save
                    </Button>

                    <Button
                      isLoading={isRemoveTodoistAPIKeyLoading}
                      onSubmit={() => removeTodoistAPIKey()}
                      variant="destructive"
                    >
                      Remove
                    </Button>
                  </div>
                </form>
              </Form>
            )}

            {todoistAPIKeyForm.getValues().key.trim() !== '' &&
              !isGetTodoistProjectsLoading &&
              projects && (
                <Form {...todoistProjectForm}>
                  <form
                    className="w-full max-w-xs space-y-4"
                    onSubmit={todoistProjectForm.handleSubmit((values) =>
                      setTodoistProject(values.projectId)
                    )}
                  >
                    <FormField
                      control={todoistProjectForm.control}
                      defaultValue={projectId}
                      name="projectId"
                      render={({ field }) => (
                        <FormItem className="max-w-xs">
                          <FormLabel className="text-base">Project</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a project" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectGroup>
                                {projects.map((proj) => (
                                  <SelectItem key={proj.id} value={proj.id}>
                                    <span className="flex flex-row items-center gap-2">
                                      <span
                                        className="font-mono font-semibold text-base italic"
                                        style={{ color: proj.hex_color }}
                                      >
                                        #
                                      </span>
                                      <span className="font-medium">
                                        {proj.name}
                                      </span>
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

                    <Button
                      isLoading={isSetTodoistProjectLoading}
                      type="submit"
                    >
                      Save
                    </Button>
                  </form>
                </Form>
              )}
          </div>
        </div>
      </SettingsLayout>
    </MainLayout>
  );
}
