import { XIcon } from 'lucide-react';
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useManageCategoriesModalState } from '@/features/subscriptions/stores';
import { useSetCategories } from '@/lib/hooks';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

type ManageCategoriesModalProps = {
  categories: string[];
  onClose: () => void;
};

export function ManageCategoriesModal({
  categories,
  onClose,
}: ManageCategoriesModalProps) {
  const state = useManageCategoriesModalState();
  const { setCategories, isSetCategoriesLoading } = useSetCategories();
  const [currentCategories, setCurrentCategories] = React.useState(categories);

  function addCategory(category: string) {
    if (!currentCategories.includes(category)) {
      setCurrentCategories([...currentCategories, category]);
    }
  }

  function removeCategory(category: string) {
    setCurrentCategories(currentCategories.filter((cat) => cat !== category));
  }

  async function onSave() {
    await setCategories(currentCategories);
    state.set('closed');
  }

  function onCloseDialog() {
    onClose();
    state.set('closed');
  }

  React.useEffect(() => {
    if (categories) {
      setCurrentCategories(categories);
    }
  }, [categories]);

  return (
    <Dialog
      onOpenChange={(open) => !open && onCloseDialog()}
      open={state.state === 'open'}
    >
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
            {currentCategories.map((category) => (
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
            onKeyDown={(e) => {
              const newCategory = e.currentTarget.value.trim();
              if (e.key === 'Enter' && newCategory) {
                addCategory(newCategory);
                e.currentTarget.value = '';
              }
            }}
            placeholder="Add a category"
          />
        </div>

        <DialogFooter>
          {/* Cancel Button */}
          <Button onClick={onCloseDialog} variant="outline">
            Cancel
          </Button>

          {/* Reset Button */}
          <Button
            onClick={() => setCurrentCategories(categories)}
            variant="outline"
          >
            Reset
          </Button>

          {/* Save Button */}
          <Button isLoading={isSetCategoriesLoading} onClick={onSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
