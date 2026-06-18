import { XIcon } from 'lucide-react';
import React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSetCategories } from '@/features/categories/hooks';
import { useManageCategoriesModalState } from '@/features/subscriptions/stores';

type ManageCategoriesModalProps = {
  categories: string[];
};

type ManageCategoriesDialogContentProps = {
  categories: string[];
  isSetCategoriesLoading: boolean;
  onCloseDialog: () => void;
  onSaveCategories: (categories: string[]) => Promise<void>;
};

function ManageCategoriesDialogContent({
  categories,
  isSetCategoriesLoading,
  onCloseDialog,
  onSaveCategories,
}: ManageCategoriesDialogContentProps) {
  const initialCategoriesRef = React.useRef(categories);
  const [draftCategories, setDraftCategories] = React.useState<string[]>(
    initialCategoriesRef.current,
  );
  const [inputValue, setInputValue] = React.useState('');

  function addCategory(category: string) {
    setDraftCategories((currentDraftCategories) => {
      if (currentDraftCategories.includes(category)) {
        return currentDraftCategories;
      }
      return [...currentDraftCategories, category];
    });
  }

  function removeCategory(category: string) {
    setDraftCategories((currentDraftCategories) =>
      currentDraftCategories.filter((cat) => cat !== category),
    );
  }

  async function onSave() {
    await onSaveCategories(draftCategories);
    onCloseDialog();
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Manage Categories</DialogTitle>
        <DialogDescription>
          Categories are how you organize your subscriptions.
        </DialogDescription>
      </DialogHeader>

      <div>
        <Label>Categories</Label>
        <div className="mt-2 mb-4 flex flex-row flex-wrap gap-2">
          {draftCategories.map((category) => (
            <Badge
              className="flex flex-row gap-1 pr-1.5"
              key={category}
              variant={'secondary'}
            >
              <span className="font-medium text-sm">{category}</span>
              <XIcon
                className="ml-1.5 size-4 text-gray-600 hover:cursor-pointer"
                onClick={() => removeCategory(category)}
                strokeWidth={2}
              />
            </Badge>
          ))}
        </div>
        <Input
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            const newCategory = inputValue.trim();
            if (e.key === 'Enter' && newCategory) {
              addCategory(newCategory);
              setInputValue('');
            }
          }}
          placeholder="Add a category"
          value={inputValue}
        />
      </div>

      <DialogFooter>
        <Button onClick={onCloseDialog} variant="outline">
          Cancel
        </Button>

        <Button
          onClick={() => {
            setDraftCategories(initialCategoriesRef.current);
            setInputValue('');
          }}
          variant="outline"
        >
          Reset
        </Button>

        <Button isLoading={isSetCategoriesLoading} onClick={onSave}>
          Save
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

export function ManageCategoriesModal({
  categories,
}: ManageCategoriesModalProps) {
  const state = useManageCategoriesModalState();
  const { setCategories, isSetCategoriesLoading } = useSetCategories();
  const isOpen = state.state === 'open';

  async function onSaveCategories(nextCategories: string[]) {
    await setCategories(nextCategories);
  }

  function onCloseDialog() {
    state.set('closed');
  }

  return (
    <Dialog onOpenChange={(open) => !open && onCloseDialog()} open={isOpen}>
      {isOpen && (
        <ManageCategoriesDialogContent
          categories={categories}
          isSetCategoriesLoading={isSetCategoriesLoading}
          onCloseDialog={onCloseDialog}
          onSaveCategories={onSaveCategories}
        />
      )}
    </Dialog>
  );
}
