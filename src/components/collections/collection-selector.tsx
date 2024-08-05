import React from "react"
import {
  GalleryVerticalEndIcon,
  PencilIcon,
  PlusCircleIcon,
  Trash2Icon
} from "lucide-react"
import { api } from "@/utils/api"
import { useModalState } from "@/lib/hooks"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import NewCollectionModal from "./NewCollectionModal"
import DeleteCollectionModal from "./DeleteCollectionModal"
import EditCollectionModal from "./EditCollectionModal"
import { CollectionWithoutUserId } from "@/features/collections/types"
import { useAtom } from "jotai"
import { selectedCollectionIdAtom } from "@/features/common/atoms"

export default function CollectionSelector() {

  const { data: collections, isLoading } = api.collections.getCollections.useQuery(undefined, { staleTime: Infinity })
  
  const [selectedCollectionId, setGlobalCollectionId] = useAtom(selectedCollectionIdAtom);
  
  const newCollectionModalState = useModalState();
  const editCollectionModalState = useModalState();
  const deleteCollectionModalState = useModalState();

  const [selectedCollection, setSelectedCollection] = React.useState<CollectionWithoutUserId | null>(null);

  function openEditModal(collection: CollectionWithoutUserId) {
    setSelectedCollection(collection)
    editCollectionModalState.setState('open')
  }

  function openDeleteModal(collection: CollectionWithoutUserId) {
    setSelectedCollection(collection)
    deleteCollectionModalState.setState('open')
  }

  return (
    <div>
      {!collections && (
        <Skeleton className="w-[160px] lg:w-[200px] h-8" />
      )}
      {collections && (
        <Select disabled={isLoading} defaultValue={selectedCollectionId || undefined} onValueChange={(collectionId) => setGlobalCollectionId(collectionId)}>
          <SelectTrigger className="w-[160px] lg:w-[200px] h-8 text-sm">
            <div className="ml-1 flex flex-row gap-4">
              <GalleryVerticalEndIcon className="size-4 mt-0.5" />
              <SelectValue placeholder={<span className="font-medium">Select Collection</span>} />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {collections.map((collection) => {
                return (
                  <div key={collection.id} className="flex flex-row gap-0.5 h-8">
                    <SelectItem value={collection.id}>
                      <span className="text-sm text-left font-medium">
                        {collection.title}
                      </span>
                    </SelectItem>

                    <Button
                      className="h-8 w-8"
                      size={"icon"}
                      variant={"ghost"} 
                      onClick={() => openEditModal(collection)}
                    >
                      <PencilIcon size={14} />
                    </Button>
                    <Button
                      className={"h-8 w-8"}
                      size={"icon"}
                      variant={"ghost"} 
                      onClick={() => openDeleteModal(collection)}
                    >
                      <Trash2Icon size={14} className="text-red-700" />
                    </Button>
                  </div>
                )
              })}
            </SelectGroup>

            <SelectSeparator />

            <SelectGroup>
              <Button
                onClick={() => newCollectionModalState.setState('open')}
                variant={"ghost"}
                size={'sm'}
                className="w-full justify-start"
              >
                <PlusCircleIcon className="mr-2 size-4" />
                New Collection
              </Button>
            </SelectGroup>
          </SelectContent>
        </Select>
      )}

      <NewCollectionModal state={newCollectionModalState} />
      {selectedCollection && <EditCollectionModal state={editCollectionModalState} collectionId={selectedCollection.id} collectionTitle={selectedCollection.title} />}
      {selectedCollection && <DeleteCollectionModal state={deleteCollectionModalState} collectionId={selectedCollection.id} />}
    </div>
  )
}
