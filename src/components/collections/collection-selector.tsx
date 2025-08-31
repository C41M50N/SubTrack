import { useAtom } from 'jotai';
import {
  GalleryVerticalEndIcon,
  PencilIcon,
  PlusCircleIcon,
  Trash2Icon,
} from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import type { CollectionWithoutUserId } from '@/features/collections';
import { selectedCollectionIdAtom } from '@/features/common/atoms';
import { useModalState } from '@/lib/hooks';
import { api } from '@/utils/api';
import DeleteCollectionModal from './delete-collection-modal';
import EditCollectionModal from './edit-collection-modal';
import NewCollectionModal from './new-collection-modal';

export default function CollectionSelector() {
  const { data: collections, isLoading } =
    api.collections.getCollections.useQuery(undefined, {
      staleTime: Number.POSITIVE_INFINITY,
    });

  const [selectedCollectionId, setGlobalCollectionId] = useAtom(
    selectedCollectionIdAtom
  );

  const newCollectionModalState = useModalState();
  const editCollectionModalState = useModalState();
  const deleteCollectionModalState = useModalState();

  const [selectedCollection, setSelectedCollection] =
    React.useState<CollectionWithoutUserId | null>(null);

  function openEditModal(collection: CollectionWithoutUserId) {
    setSelectedCollection(collection);
    editCollectionModalState.setState('open');
  }

  function openDeleteModal(collection: CollectionWithoutUserId) {
    setSelectedCollection(collection);
    deleteCollectionModalState.setState('open');
  }

  return (
    <div>
      {!collections && <Skeleton className="h-10 w-[160px] lg:w-[200px]" />}
      {collections && (
        <Select
          defaultValue={selectedCollectionId || undefined}
          disabled={isLoading}
          onValueChange={(collectionId) => setGlobalCollectionId(collectionId)}
          value={selectedCollectionId || undefined}
        >
          <SelectTrigger className="h-10 w-[150px] text-sm lg:w-[180px]">
            <div className="ml-1 flex flex-row gap-4">
              <GalleryVerticalEndIcon className="mt-0.5 size-4" />
              <SelectValue
                placeholder={
                  <span className="font-medium">Select Collection</span>
                }
              />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {collections.map((collection) => {
                return (
                  <div
                    className="flex h-10 flex-row gap-0.5"
                    key={collection.id}
                  >
                    <SelectItem value={collection.id}>
                      <span className="text-left font-medium text-sm">
                        {collection.title}
                      </span>
                    </SelectItem>

                    <Button
                      className="size-10"
                      onClick={() => openEditModal(collection)}
                      size={'icon'}
                      variant={'ghost'}
                    >
                      <PencilIcon size={14} />
                    </Button>
                    <Button
                      className={'size-10'}
                      onClick={() => openDeleteModal(collection)}
                      size={'icon'}
                      variant={'ghost'}
                    >
                      <Trash2Icon className="text-red-700" size={14} />
                    </Button>
                  </div>
                );
              })}
            </SelectGroup>

            <SelectSeparator />

            <SelectGroup>
              <Button
                className="h-10 w-full justify-start"
                onClick={() => newCollectionModalState.setState('open')}
                variant={'ghost'}
              >
                <PlusCircleIcon className="mr-2 size-4" />
                New Collection
              </Button>
            </SelectGroup>
          </SelectContent>
        </Select>
      )}

      <NewCollectionModal state={newCollectionModalState} />
      {selectedCollection && (
        <EditCollectionModal
          collection={selectedCollection}
          state={editCollectionModalState}
        />
      )}
      {selectedCollection && (
        <DeleteCollectionModal
          collectionId={selectedCollection.id}
          state={deleteCollectionModalState}
        />
      )}
    </div>
  );
}
