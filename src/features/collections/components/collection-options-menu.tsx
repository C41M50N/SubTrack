import {
  CopyIcon,
  DownloadIcon,
  EllipsisIcon,
  TextCursorIcon,
  Trash2Icon,
} from 'lucide-react';

import { MenuActionItem } from '@/components/menu-action-item';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';

export function CollectionOptionsMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button
          size="icon-xs"
          variant="ghost"
          aria-label="Collection options"
          className="h-4 p-3"
          onClick={(e) => e.stopPropagation()}
        >
          <EllipsisIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-44" align="start" side="right">
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <MenuActionItem icon={TextCursorIcon} label="Rename" />
          </DropdownMenuItem>
          <DropdownMenuItem>
            <MenuActionItem icon={CopyIcon} label="Duplicate" />
          </DropdownMenuItem>
          <DropdownMenuItem>
            <MenuActionItem icon={DownloadIcon} label="Export" />
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive">
            <MenuActionItem
              variant="destructive"
              icon={Trash2Icon}
              label="Delete"
            />
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
