import { useSuspenseQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from '@tanstack/react-router';
import {
  ChevronsUpDownIcon,
  GalleryVerticalEndIcon,
  PlusIcon,
} from 'lucide-react';
import { useState } from 'react';

import { MenuActionItem } from '@/components/menu-action-item';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { CollectionOptionsMenu } from '@/features/collections/components/collection-options-menu';
import { NewCollectionDialog } from '@/features/collections/components/new-collection-dialog';
import { collectionsQueryOptions } from '@/features/collections/queries';

export function CollectionSwitcher() {
  const { collectionId } = useParams({ from: '/_protected/c/$collectionId' });
  const navigate = useNavigate();
  const { data: collections } = useSuspenseQuery(collectionsQueryOptions());
  const [isNewCollectionOpen, setIsNewCollectionOpen] = useState(false);

  const activeCollection = collections.find(
    (collection) => collection.id === collectionId,
  );

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="px-2 w-full">
          <Button
            size="lg"
            variant="outline"
            className="px-3 w-full justify-between"
          >
            <div className="flex items-center gap-3">
              <GalleryVerticalEndIcon className="size-4" />
              {activeCollection?.name ?? 'Select collection'}
            </div>
            <ChevronsUpDownIcon className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="start" side="right">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Collections</DropdownMenuLabel>
            {collections.map((collection) => (
              <DropdownMenuItem
                key={collection.id}
                className="py-1"
                onClick={() =>
                  navigate({
                    to: '/c/$collectionId/dashboard',
                    params: { collectionId: collection.id },
                  })
                }
              >
                <div className="w-full flex items-center justify-between">
                  <span
                    className={
                      collection.id === collectionId ? 'font-medium' : undefined
                    }
                  >
                    {collection.name}
                  </span>
                  <CollectionOptionsMenu />
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setIsNewCollectionOpen(true)}>
              <MenuActionItem icon={PlusIcon} label="New Collection" />
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <NewCollectionDialog
        open={isNewCollectionOpen}
        onOpenChange={setIsNewCollectionOpen}
      />
    </>
  );
}
