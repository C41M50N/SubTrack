import {
  ChevronsUpDownIcon,
  GalleryVerticalEndIcon,
  PlusIcon,
} from 'lucide-react';

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

export function CollectionSwitcher() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="px-2 w-full">
        <Button
          size="lg"
          variant="outline"
          className="px-3 w-full justify-between"
        >
          <div className="flex items-center gap-3">
            <GalleryVerticalEndIcon className="size-4" />
            Active Collection
          </div>
          <ChevronsUpDownIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start" side="right">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Collections</DropdownMenuLabel>
          <DropdownMenuItem className="py-1">
            <div className="w-full flex items-center justify-between">
              Collection 1
              <CollectionOptionsMenu />
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem className="py-1">
            <div className="w-full flex items-center justify-between">
              Collection 2
              <CollectionOptionsMenu />
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem className="py-1">
            <div className="w-full flex items-center justify-between">
              Collection 3
              <CollectionOptionsMenu />
            </div>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => console.log('Create new collection')}
          >
            <MenuActionItem icon={PlusIcon} label="New Collection" />
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
