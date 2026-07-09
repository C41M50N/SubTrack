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
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import type { SubscriptionTransferFormat } from '@/features/subscriptions/export';

interface CollectionOptionsMenuProps {
  onRename: () => void;
  onDuplicate: () => void;
  onExport: (format: SubscriptionTransferFormat) => void;
  onDelete: () => void;
}

export function CollectionOptionsMenu({
  onRename,
  onDuplicate,
  onExport,
  onDelete,
}: CollectionOptionsMenuProps) {
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
          <DropdownMenuItem onClick={onRename}>
            <MenuActionItem icon={TextCursorIcon} label="Rename" />
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDuplicate}>
            <MenuActionItem icon={CopyIcon} label="Duplicate" />
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger onClick={(e) => e.stopPropagation()}>
              <MenuActionItem icon={DownloadIcon} label="Export" />
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => onExport('json')}>
                Export as JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport('csv')}>
                Export as CSV
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuItem variant="destructive" onClick={onDelete}>
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
