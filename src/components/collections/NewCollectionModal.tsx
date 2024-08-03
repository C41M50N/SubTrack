import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@/utils/api";
import { ModalState } from "@/lib/hooks";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { useAtom } from "jotai";
import { selectedCollectionIdAtom } from "@/lib/stores/selected-collection";

type Props = {
  state: ModalState;
}

const FormSchema = z.object({
  title: z.string()
          .min(2, { message: 'Title must be at least 2 characters' })
          .max(30, { message: 'Title must be at most 30 characters' })
})

export default function NewCollectionModal({ state }: Props) {

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      title: ''
    }
  })

  const ctx = api.useContext()
  const {
    mutateAsync: createCollection,
    isLoading: isCreateCollectionLoading
  } = api.collections.createCollection.useMutation({
    onSuccess(data, variables, context) {
      form.reset()
      ctx.collections.getCollections.refetch();
    },
    onError(error, variables, context) {
      toast({
        variant: 'error',
        title: error.message
      })
    },
  })

  async function onSubmit(values: z.infer<typeof FormSchema>) {
    await createCollection({ collectionTitle: values.title })
    state.setState('closed')
  }

  return (
    <Dialog open={state.state === "open" ? true : false} onOpenChange={(open) => !open && state.setState("closed")}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Collection</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              name="title"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Collection Title" {...field} type="search" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" isLoading={isCreateCollectionLoading}>Submit</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
