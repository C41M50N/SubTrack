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
import { Collection } from "@prisma/client";
import { IconDeviceFloppy } from "@tabler/icons-react";

type Props = {
  state: ModalState;
  collectionId: Collection['id'];
  collectionTitle: Collection['title'];
}

const FormSchema = z.object({
  title: z.string()
          .min(2, { message: 'Title must be at least 2 characters' })
          .max(30, { message: 'Title must be at most 30 characters' })
})

export default function EditCollectionModal({ state, collectionId, collectionTitle }: Props) {

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      title: collectionTitle
    }
  })

  const ctx = api.useContext()
  const { mutateAsync: editCollectionTitle, isLoading: isEditCollectionLoading } = api.collections.editCollectionTitle.useMutation({
    onSuccess(data, variables, context) {
      form.reset()
      ctx.collections.getCollections.refetch();
    },
    onError(error, variables, context) {
      toast({
        variant: 'error',
        title: error.message
      })
    }
  })

  async function onSubmit(values: z.infer<typeof FormSchema>) {
    await editCollectionTitle({ title: values.title, collection_id: collectionId })
    state.setState('closed')
  }

  return (
    <Dialog open={state.state === "open" ? true : false} onOpenChange={(open) => !open && state.setState("closed")}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Collection</DialogTitle>
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
              <Button type="submit" className="gap-1" isLoading={isEditCollectionLoading}>
                <IconDeviceFloppy size={20} strokeWidth={1.75} />
                Save
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
